export const unGetData = ({ fields, object }: { fields: string[]; object: Record<string, any> }) => {
  const result = { ...object }
  fields.forEach((field) => delete result[field])
  return result
}

export const getPaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export const buildPaginatedResponse = <T>(data: T[], total: number, page: number, limit: number) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
})
