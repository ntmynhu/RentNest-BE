import { Request, Response } from 'express'
import { contractService } from '~/services/contract.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'

class ContractController {
  create = async (req: Request, res: Response) => {
    const contract = await contractService.createContract(req.user!.id, req.body)
    return new CreatedResponse({ message: 'Contract created', metaData: contract }).send(res)
  }

  getAll = async (req: Request, res: Response) => {
    const contracts = await contractService.getLandlordContracts(req.user!.id)
    return new SuccessResponse({ message: 'Contracts retrieved', metaData: contracts }).send(res)
  }

  getById = async (req: Request, res: Response) => {
    const contract = await contractService.getContractById(req.user!.id, parseInt(req.params.id as string))
    return new SuccessResponse({ message: 'Contract retrieved', metaData: contract }).send(res)
  }

  update = async (req: Request, res: Response) => {
    const contract = await contractService.updateContract(req.user!.id, parseInt(req.params.id as string), req.body)
    return new SuccessResponse({ message: 'Contract updated', metaData: contract }).send(res)
  }

  getMine = async (req: Request, res: Response) => {
    const contracts = await contractService.getTenantContracts(req.user!.id)
    return new SuccessResponse({ message: 'Contracts retrieved', metaData: contracts }).send(res)
  }

  confirm = async (req: Request, res: Response) => {
    const contract = await contractService.confirmContract(req.user!.id, parseInt(req.params.id as string))
    return new SuccessResponse({ message: 'Contract confirmed', metaData: contract }).send(res)
  }

  activate = async (req: Request, res: Response) => {
    const contract = await contractService.activateContract(req.user!.id, parseInt(req.params.id as string))
    return new SuccessResponse({ message: 'Contract activated', metaData: contract }).send(res)
  }

  archive = async (req: Request, res: Response) => {
    const contract = await contractService.archiveContract(req.user!.id, parseInt(req.params.id as string))
    return new SuccessResponse({ message: 'Contract archived', metaData: contract }).send(res)
  }
}

export const contractController = new ContractController()
