import { Application, type ApplicationOptions } from 'pixi.js'

type AppFactory = () => Application

// Pixi chooses WebGL when WebGPU is unavailable. If a device is detected but
// initialization itself fails, retry with a fresh WebGL application as well.
export async function initializeRenderer(options: Partial<ApplicationOptions>, create: AppFactory = () => new Application()): Promise<Application> {
  let app = create()
  try {
    await app.init({ ...options, preference: ['webgpu', 'webgl'] })
    return app
  } catch {
    try { app.destroy(true, { children: true }) } catch { /* The renderer may be only partially initialized. */ }
    app = create()
    await app.init({ ...options, preference: 'webgl' })
    return app
  }
}
