import 'reflect-metadata'
import routes from './routes'
import expresso from '@expresso/app'
import { container } from 'tsyringe'
import errors from '@expresso/errors'
import sendgrid from '../lib/sendgrid'
import { Services } from '../services'
import { IAppConfig } from '../app-config'
import loader from '../utils/loadRenderers'
import { IExpressoAppFactory } from '@expresso/server'
import { Express, Request, Response, NextFunction } from 'express'

export type RendererFn = (text: string, data: any) => Promise<string>
export type RendererExport = { name: string, fn: RendererFn }
export type Renderers = {
  [rendererName: string]: RendererFn
}

export const app: IExpressoAppFactory<IAppConfig> = expresso(async (app: Express, config: IAppConfig, environment: string) => {
  if (!config.sendgrid.apiKey) throw new Error('Sendgrid key not set!')

  container.register('DefaultFromAddress', { useValue: config.defaultFromAddress })
  container.register('SendgridService', { useValue: sendgrid.factory(config.sendgrid.apiKey) })
  container.register('Renderers', { useValue: loader.loadRenderers(config.rendererList) })
  // Resolve services with container
  const services = container.resolve(Services)

  app.post('/send', routes.email.send(services.emailService))

  app.use((err: any, _req: Request, _res: Response, next: NextFunction) => {
    if (err.response && err.response.body) {
      console.log(JSON.stringify(err.response.body, null, 4))
    }

    next(err)
  })

  app.use(errors(environment))
})
