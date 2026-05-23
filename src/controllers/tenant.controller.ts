import { Request, Response } from 'express'
import { tenantService } from '~/services/tenant.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'

class TenantController {
  create = async (req: Request, res: Response) => {
    const tenant = await tenantService.createTenant(req.user!.id, req.body)
    return new CreatedResponse({ message: 'Tenant added', metaData: tenant }).send(res)
  }

  getAll = async (req: Request, res: Response) => {
    const listingId = req.query.listingId ? parseInt(req.query.listingId as string) : undefined
    const tenants = await tenantService.getLandlordTenants(req.user!.id, listingId)
    return new SuccessResponse({ message: 'Tenants retrieved', metaData: tenants }).send(res)
  }

  getById = async (req: Request, res: Response) => {
    const tenant = await tenantService.getTenantById(req.user!.id, parseInt(req.params.id))
    return new SuccessResponse({ message: 'Tenant retrieved', metaData: tenant }).send(res)
  }

  update = async (req: Request, res: Response) => {
    const tenant = await tenantService.updateTenant(req.user!.id, parseInt(req.params.id), req.body)
    return new SuccessResponse({ message: 'Tenant updated', metaData: tenant }).send(res)
  }

  remove = async (req: Request, res: Response) => {
    await tenantService.removeTenant(req.user!.id, parseInt(req.params.id))
    return new SuccessResponse({ message: 'Tenant removed' }).send(res)
  }
}

export const tenantController = new TenantController()
