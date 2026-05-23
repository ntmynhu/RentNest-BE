import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { authenticate } from '~/middlewares/auth.middleware'
import { SuccessResponse } from '~/core/success.response'
import { BadRequestError } from '~/core/error.response'
import { wrapRequestHandler } from '~/utils/handler'

const router = Router()

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// multer: store in memory, max 5MB per file, image only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Chỉ được upload file ảnh (jpg, png, webp, ...)'))
    }
  },
})

// Upload một ảnh → Cloudinary
// POST /api/upload/image  (form-data field: "image")
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  wrapRequestHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError('Không tìm thấy file ảnh')
    }

    const b64 = req.file.buffer.toString('base64')
    const dataUri = `data:${req.file.mimetype};base64,${b64}`

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'rentnest',
      resource_type: 'image',
      transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
    })

    return new SuccessResponse({
      message: 'Upload thành công',
      metaData: { url: result.secure_url, publicId: result.public_id },
    }).send(res)
  })
)

// Upload nhiều ảnh (tối đa 10) → Cloudinary
// POST /api/upload/images  (form-data field: "images" - multiple)
router.post(
  '/images',
  authenticate,
  upload.array('images', 10),
  wrapRequestHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      throw new BadRequestError('Không tìm thấy file ảnh')
    }

    const uploads = await Promise.all(
      files.map(file => {
        const b64 = file.buffer.toString('base64')
        const dataUri = `data:${file.mimetype};base64,${b64}`
        return cloudinary.uploader.upload(dataUri, {
          folder: 'rentnest',
          resource_type: 'image',
          transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
        })
      })
    )

    return new SuccessResponse({
      message: `Upload thành công ${uploads.length} ảnh`,
      metaData: uploads.map(r => ({ url: r.secure_url, publicId: r.public_id })),
    }).send(res)
  })
)

export default router
