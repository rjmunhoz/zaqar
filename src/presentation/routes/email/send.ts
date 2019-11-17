import rescue from 'express-rescue'
import { boom } from '@expresso/errors'
import { validate } from '@expresso/validator'
import { Request, Response, NextFunction } from 'express'
import { EmailService } from '../../../services/EmailService'
import { IEmail } from '../../../domain/email/structures/IEmail'
import { TemplateError } from '../../../domain/email/errors/TemplateError'

export function factory (service: EmailService) {
  return [
    validate({
      type: 'object',
      properties: {
        from: { type: 'string', format: 'email' },
        to: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email'
          }
        },
        subject: {
          type: 'string'
        },
        template: {
          type: 'string'
        },
        cc: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email'
          }
        },
        data: {
          type: 'object'
        },
        bcc: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email'
          }
        }
      },
      required: ['to', 'subject', 'template'],
      additionalProperties: false
    }),
    rescue(async (req: Request, res: Response) => {
      const data = req.body as IEmail
      const entity = await service.sendEmail(data)

      res.status(202)
        .json(entity.toObject())
    }),
    (err: any, _req: Request, _res: Response, next: NextFunction) => {
      if (err instanceof TemplateError) return next(boom.badData(err.message, { code: 'failed_to_parse_template' }))
      next(err)
    }
  ]
}