import { Request, Response } from 'express'
import { userService } from '~/services/user.service'
import { SuccessResponse } from '~/core/success.response'

class UserController {
  getAll = async (req: Request, res: Response) => {
    const result = await userService.getUsers(req.query)
    return new SuccessResponse({ message: 'Users retrieved', metaData: result }).send(res)
  }

  getById = async (req: Request, res: Response) => {
    const user = await userService.getUserById(parseInt(req.params.id as string))
    return new SuccessResponse({ message: 'User retrieved', metaData: user }).send(res)
  }

  warn = async (req: Request, res: Response) => {
    const { reason } = req.body
    const warning = await userService.warnUser(req.user!.id, parseInt(req.params.id as string), reason)
    return new SuccessResponse({ message: 'Warning issued', metaData: warning }).send(res)
  }

  ban = async (req: Request, res: Response) => {
    const { reason } = req.body
    const user = await userService.banUser(req.user!.id, parseInt(req.params.id as string), reason)
    return new SuccessResponse({ message: 'User banned', metaData: user }).send(res)
  }
}

export const userController = new UserController()
