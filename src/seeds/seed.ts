import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Ảnh thực từ picsum.photos (guaranteed working)
const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b6ac5?w=800&q=80',
  'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&q=80',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  'https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=800&q=80',
]

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('Admin@123', 10)

  // ─── Users ───────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rentnest.com' },
    update: {},
    create: {
      email: 'admin@rentnest.com', passwordHash,
      fullName: 'RentNest Admin', phone: '0901000001',
      role: 'ADMIN', status: 'ACTIVE', emailVerified: true,
    },
  })

  const landlord1 = await prisma.user.upsert({
    where: { email: 'landlord@rentnest.com' },
    update: {},
    create: {
      email: 'landlord@rentnest.com', passwordHash,
      fullName: 'Nguyễn Văn An', phone: '0901000002',
      role: 'LANDLORD', status: 'ACTIVE', emailVerified: true,
    },
  })

  const landlord2 = await prisma.user.upsert({
    where: { email: 'landlord2@rentnest.com' },
    update: {},
    create: {
      email: 'landlord2@rentnest.com', passwordHash,
      fullName: 'Trần Thị Bình', phone: '0902000002',
      role: 'LANDLORD', status: 'ACTIVE', emailVerified: true,
    },
  })

  const landlord3 = await prisma.user.upsert({
    where: { email: 'landlord3@rentnest.com' },
    update: {},
    create: {
      email: 'landlord3@rentnest.com', passwordHash,
      fullName: 'Lê Minh Cường', phone: '0903000003',
      role: 'LANDLORD', status: 'ACTIVE', emailVerified: true,
    },
  })

  const tenantUser = await prisma.user.upsert({
    where: { email: 'tenant@rentnest.com' },
    update: {},
    create: {
      email: 'tenant@rentnest.com', passwordHash,
      fullName: 'Phạm Thị Dung', phone: '0901000003',
      role: 'TENANT', status: 'ACTIVE', emailVerified: true,
    },
  })

  // Thêm tenant user thứ 2 để demo
  const tenantUser2 = await prisma.user.upsert({
    where: { email: 'tenant2@rentnest.com' },
    update: {},
    create: {
      email: 'tenant2@rentnest.com', passwordHash,
      fullName: 'Hoàng Văn Em', phone: '0904000004',
      role: 'TENANT', status: 'ACTIVE', emailVerified: true,
    },
  })

  // ─── Amenities ───────────────────────────────────────────────
  const amenityNames = [
    'WiFi', 'Điều hòa', 'Bãi đỗ xe', 'Camera an ninh', 'Thang máy',
    'Máy giặt', 'Tủ lạnh', 'TV', 'Máy nước nóng', 'Ban công',
    'Bếp riêng', 'Toilet riêng', 'Nội thất đầy đủ', 'Giường', 'Tủ quần áo',
  ]

  for (const name of amenityNames) {
    await prisma.amenity.upsert({ where: { name }, update: {}, create: { name } })
  }

  const getAmenity = (name: string) => prisma.amenity.findUnique({ where: { name } })

  const [
    wifi, ac, parking, camera, elevator,
    washer, fridge, tv, heater, balcony,
    kitchen, toilet, furniture, bed, wardrobe,
  ] = await Promise.all(amenityNames.map(getAmenity))

  // ─── Xóa dữ liệu cũ (để chạy seed lại không bị trùng) ────────
  await prisma.userBehavior.deleteMany({})
  await prisma.message.deleteMany({})
  await prisma.conversation.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.contract.deleteMany({})
  await prisma.tenant.deleteMany({})
  await prisma.report.deleteMany({})
  await prisma.listingAmenity.deleteMany({})
  await prisma.listingImage.deleteMany({})
  await prisma.listing.deleteMany({})

  console.log('🗑️  Cleared old listings...')

  // ─── Helper tạo listing ───────────────────────────────────────
  const createListing = async (data: {
    landlordId: number
    title: string
    description: string
    price: number
    address: string
    district: string
    city: string
    area: number
    roomType: string
    status?: string
    imageIndices: number[]
    amenityIds: number[]
    approved?: boolean
  }) => {
    return prisma.listing.create({
      data: {
        landlordId: data.landlordId,
        title: data.title,
        description: data.description,
        price: data.price,
        address: data.address,
        district: data.district,
        city: data.city,
        area: data.area,
        roomType: data.roomType as any,
        status: (data.status ?? 'PUBLISHED') as any,
        ...(data.approved ? { approvedAt: new Date(), approvedBy: admin.id } : {}),
        images: {
          create: data.imageIndices.map((idx, i) => ({
            url: ROOM_IMAGES[idx % ROOM_IMAGES.length],
            isPrimary: i === 0,
          })),
        },
        amenities: {
          create: data.amenityIds.filter(Boolean).map(amenityId => ({ amenityId })),
        },
      },
    })
  }

  // ─── 15 Listings ─────────────────────────────────────────────
  // Landlord 1 - HCM
  const l1 = await createListing({
    landlordId: landlord1.id, approved: true,
    title: 'Phòng trọ cao cấp Quận 1, đầy đủ nội thất',
    description: 'Phòng rộng rãi, thoáng mát, ngay trung tâm quận 1. Có đầy đủ nội thất: giường, tủ, bàn làm việc, máy lạnh. An ninh 24/7 với camera và bảo vệ. Gần chợ Bến Thành, siêu thị, trường học.',
    price: 5500000, area: 28,
    address: '15 Lê Thánh Tôn, Phường Bến Nghé',
    district: 'Quận 1', city: 'TP. Hồ Chí Minh',
    roomType: 'SINGLE_ROOM', imageIndices: [0, 1, 2],
    amenityIds: [wifi!.id, ac!.id, camera!.id, furniture!.id, bed!.id, toilet!.id],
  })

  const l2 = await createListing({
    landlordId: landlord1.id, approved: true,
    title: 'Căn hộ mini Bình Thạnh, view đẹp tầng cao',
    description: 'Mini apartment tầng 8, view sông Sài Gòn tuyệt đẹp. Nội thất hiện đại, đầy đủ tiện nghi cho 1-2 người. Khu vực yên tĩnh, an ninh tốt. Gần cầu Sài Gòn, dễ di chuyển vào trung tâm.',
    price: 7800000, area: 38,
    address: '120 Xô Viết Nghệ Tĩnh, Phường 26',
    district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh',
    roomType: 'MINI_APARTMENT', imageIndices: [1, 3, 5],
    amenityIds: [wifi!.id, ac!.id, elevator!.id, fridge!.id, washer!.id, balcony!.id],
  })

  const l3 = await createListing({
    landlordId: landlord1.id,
    title: 'Phòng trọ giá rẻ gần ĐH Bách Khoa HCM',
    description: 'Phòng trọ phù hợp sinh viên, cách trường ĐH Bách Khoa 500m. Có wifi, điện nước giá dân. Khu vực đông sinh viên, nhiều quán ăn giá rẻ xung quanh. Giờ giấc tự do.',
    price: 2800000, area: 18,
    address: '45 Lý Thường Kiệt, Phường 7',
    district: 'Quận 10', city: 'TP. Hồ Chí Minh',
    roomType: 'SINGLE_ROOM', imageIndices: [2, 6],
    amenityIds: [wifi!.id, heater!.id, toilet!.id],
    status: 'PENDING_APPROVAL',
  })

  const l4 = await createListing({
    landlordId: landlord1.id, approved: true,
    title: 'Phòng ở ghép Quận 3, gần Vincom Center',
    description: 'Phòng ở ghép tiện nghi cho 2-3 người. Nằm ngay gần Vincom Center, Nhà thờ Đức Bà. Đầy đủ điều hòa, tủ lạnh, máy giặt chung. Phù hợp cho người đi làm muốn tiết kiệm chi phí.',
    price: 1900000, area: 35,
    address: '8 Pasteur, Phường Nguyễn Thái Bình',
    district: 'Quận 3', city: 'TP. Hồ Chí Minh',
    roomType: 'SHARED_ROOM', imageIndices: [3, 7],
    amenityIds: [wifi!.id, ac!.id, fridge!.id, washer!.id, camera!.id],
  })

  // Landlord 2 - HCM + Đà Nẵng
  const l5 = await createListing({
    landlordId: landlord2.id, approved: true,
    title: 'Căn hộ Thủ Đức, gần ĐHQG, nội thất cao cấp',
    description: 'Căn hộ rộng 55m² với 1 phòng ngủ riêng, phòng khách, bếp, 2 WC. Nội thất cao cấp, máy lạnh 2 phòng, tủ lạnh, máy giặt riêng. Khu vực sầm uất, gần ĐHQG, nhiều công ty công nghệ.',
    price: 9500000, area: 55,
    address: '30 Võ Văn Ngân, Phường Linh Chiểu',
    district: 'TP. Thủ Đức', city: 'TP. Hồ Chí Minh',
    roomType: 'APARTMENT', imageIndices: [4, 8, 0],
    amenityIds: [wifi!.id, ac!.id, elevator!.id, washer!.id, fridge!.id, tv!.id, kitchen!.id, balcony!.id],
  })

  const l6 = await createListing({
    landlordId: landlord2.id, approved: true,
    title: 'Phòng trọ Gò Vấp, gần sân bay Tân Sơn Nhất',
    description: 'Phòng rộng thoáng, cửa sổ lớn nhiều ánh sáng tự nhiên. Cách sân bay Tân Sơn Nhất 2km. Phù hợp nhân viên hàng không, phi công, tiếp viên. Khu vực yên tĩnh.',
    price: 3500000, area: 22,
    address: '77 Nguyễn Kiệm, Phường 3',
    district: 'Gò Vấp', city: 'TP. Hồ Chí Minh',
    roomType: 'SINGLE_ROOM', imageIndices: [5, 9],
    amenityIds: [wifi!.id, ac!.id, heater!.id, parking!.id, toilet!.id],
  })

  const l7 = await createListing({
    landlordId: landlord2.id, approved: true,
    title: 'Studio Đà Nẵng view biển Mỹ Khê tuyệt đẹp',
    description: 'Studio hiện đại ngay mặt đường biển Mỹ Khê. View trực tiếp ra biển, ánh sáng chan hoà. Đầy đủ nội thất IKEA, bếp nhỏ, máy lạnh, wifi tốc độ cao. Lý tưởng cho người làm remote hoặc thực tập.',
    price: 6200000, area: 32,
    address: '120 Võ Nguyên Giáp',
    district: 'Ngũ Hành Sơn', city: 'Đà Nẵng',
    roomType: 'MINI_APARTMENT', imageIndices: [6, 10, 11],
    amenityIds: [wifi!.id, ac!.id, balcony!.id, kitchen!.id, furniture!.id, heater!.id],
  })

  const l8 = await createListing({
    landlordId: landlord2.id,
    title: 'Phòng trọ Đà Nẵng gần cầu Rồng, giá sinh viên',
    description: 'Phòng trọ gần cầu Rồng nổi tiếng, thuận tiện di chuyển toàn thành phố. Phù hợp sinh viên trường ĐH Đà Nẵng và các trường lân cận. Wifi miễn phí, điện nước giá dân.',
    price: 2200000, area: 16,
    address: '34 Trần Phú, Phường Hải Châu 1',
    district: 'Hải Châu', city: 'Đà Nẵng',
    roomType: 'SINGLE_ROOM', imageIndices: [7, 12],
    amenityIds: [wifi!.id, heater!.id, toilet!.id],
    status: 'PENDING_APPROVAL',
  })

  // Landlord 3 - Hà Nội
  const l9 = await createListing({
    landlordId: landlord3.id, approved: true,
    title: 'Căn hộ Cầu Giấy HN, full nội thất, gần ĐH Quốc Gia',
    description: 'Căn hộ chung cư 2 phòng ngủ, đầy đủ nội thất cao cấp. Tòa nhà hiện đại có thang máy, bảo vệ 24/7, bãi xe rộng. Cách ĐH Quốc Gia Hà Nội 800m, gần nhiều trường đại học khác.',
    price: 11000000, area: 65,
    address: '18 Cầu Giấy, Phường Quan Hoa',
    district: 'Cầu Giấy', city: 'Hà Nội',
    roomType: 'APARTMENT', imageIndices: [8, 0, 4],
    amenityIds: [wifi!.id, ac!.id, elevator!.id, washer!.id, fridge!.id, tv!.id, kitchen!.id, parking!.id, camera!.id],
  })

  const l10 = await createListing({
    landlordId: landlord3.id, approved: true,
    title: 'Phòng trọ Đống Đa, gần Hồ Tây, trung tâm Hà Nội',
    description: 'Phòng trọ sạch đẹp, thoáng mát, cách Hồ Tây 10 phút đi xe. Khu vực yên tĩnh, an ninh tốt. Dễ dàng di chuyển đến các trung tâm thương mại, văn phòng. Có điều hòa, nóng lạnh.',
    price: 4200000, area: 24,
    address: '56 Đê La Thành, Phường Ô Chợ Dừa',
    district: 'Đống Đa', city: 'Hà Nội',
    roomType: 'SINGLE_ROOM', imageIndices: [9, 13],
    amenityIds: [wifi!.id, ac!.id, heater!.id, toilet!.id, bed!.id, wardrobe!.id],
  })

  const l11 = await createListing({
    landlordId: landlord3.id, approved: true,
    title: 'Mini apartment Tây Hồ, view Hồ Tây cực đẹp',
    description: 'Mini apartment tầng 5 với ban công nhìn thẳng ra Hồ Tây. Nội thất đầy đủ và hiện đại. Khu vực Tây Hồ yên tĩnh, nhiều nhà hàng, quán cafe đẹp. Lý tưởng cho người làm việc tự do.',
    price: 8500000, area: 40,
    address: '25 Đặng Thai Mai, Phường Quảng An',
    district: 'Tây Hồ', city: 'Hà Nội',
    roomType: 'MINI_APARTMENT', imageIndices: [10, 2, 6],
    amenityIds: [wifi!.id, ac!.id, balcony!.id, kitchen!.id, fridge!.id, tv!.id, heater!.id],
  })

  const l12 = await createListing({
    landlordId: landlord3.id, approved: true,
    title: 'Phòng ở ghép Hoàn Kiếm, trung tâm phố cổ',
    description: 'Phòng ở ghép ngay trung tâm phố cổ Hà Nội. 2-3 người ở. Cách Hồ Hoàn Kiếm 5 phút đi bộ. Vị trí vàng, siêu tiện lợi. Điện nước giá thành phố.',
    price: 2500000, area: 30,
    address: '12 Hàng Bông, Phường Hàng Bông',
    district: 'Hoàn Kiếm', city: 'Hà Nội',
    roomType: 'SHARED_ROOM', imageIndices: [11, 14],
    amenityIds: [wifi!.id, ac!.id, toilet!.id, heater!.id],
  })

  const l13 = await createListing({
    landlordId: landlord3.id,
    title: 'Ký túc xá mini Hai Bà Trưng, 4 giường/phòng',
    description: 'Phòng ký túc xá mini hiện đại, 4 giường/phòng với tủ cá nhân khóa riêng. Có phòng tắm riêng, wifi, điều hòa. Phù hợp sinh viên, người mới đến Hà Nội. Bảo vệ 24/7.',
    price: 1500000, area: 45,
    address: '89 Lê Đại Hành, Phường Lê Đại Hành',
    district: 'Hai Bà Trưng', city: 'Hà Nội',
    roomType: 'DORMITORY', imageIndices: [12, 3],
    amenityIds: [wifi!.id, ac!.id, camera!.id, heater!.id, bed!.id, wardrobe!.id],
    status: 'PENDING_APPROVAL',
  })

  const l14 = await createListing({
    landlordId: landlord2.id, approved: true,
    title: 'Căn hộ studio Quận 7, khu Phú Mỹ Hưng sầm uất',
    description: 'Studio hiện đại tại trung tâm Phú Mỹ Hưng, khu đô thị cao cấp nhất TP.HCM. Đầy đủ nội thất nhập khẩu, hướng Đông Nam nhiều gió. Có hồ bơi, gym, trung tâm thương mại ngay dưới chân.',
    price: 12000000, area: 42,
    address: '18 Nguyễn Lương Bằng, Phường Tân Phú',
    district: 'Quận 7', city: 'TP. Hồ Chí Minh',
    roomType: 'MINI_APARTMENT', imageIndices: [13, 1, 5],
    amenityIds: [wifi!.id, ac!.id, elevator!.id, washer!.id, fridge!.id, tv!.id, kitchen!.id, furniture!.id, parking!.id],
  })

  const l15 = await createListing({
    landlordId: landlord1.id, approved: true,
    title: 'Phòng trọ Tân Bình, gần sân bay, giá tốt',
    description: 'Phòng trọ sạch sẽ, thoáng mát, an ninh tốt. Cách sân bay quốc tế Tân Sơn Nhất 1.5km. Phù hợp nhân viên hàng không hoặc người hay đi công tác. Có chỗ để xe miễn phí.',
    price: 3200000, area: 20,
    address: '102 Hoàng Văn Thụ, Phường 4',
    district: 'Tân Bình', city: 'TP. Hồ Chí Minh',
    roomType: 'SINGLE_ROOM', imageIndices: [14, 8],
    amenityIds: [wifi!.id, ac!.id, heater!.id, parking!.id, toilet!.id, bed!.id],
  })

  console.log(`✅ Created 15 listings`)

  // ─── Demo: Tenant + Contract + Payments cho tenant@rentnest.com ──
  // Tạo tenant record cho l1 (Quận 1)
  const tenantRecord = await prisma.tenant.create({
    data: {
      landlordId: landlord1.id,
      listingId: l1.id,
      userId: tenantUser.id,
      name: 'Phạm Thị Dung',
      email: 'tenant@rentnest.com',
      phone: '0901000003',
      moveInDate: new Date('2025-01-01'),
      status: 'ACTIVE',
    },
  })

  // Tạo hợp đồng ACTIVE
  const contract = await prisma.contract.create({
    data: {
      landlordId: landlord1.id,
      tenantId: tenantRecord.id,
      listingId: l1.id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      rentAmount: 5500000,
      depositAmount: 11000000,
      terms: 'Hợp đồng 12 tháng. Thanh toán vào ngày 1 mỗi tháng. Đặt cọc 2 tháng tiền thuê.',
      status: 'ACTIVE',
    },
  })

  // Tạo lịch sử thanh toán 6 tháng
  const paymentMonths = [
    { month: '2025-01', paid: true,  paidDate: '2025-01-02' },
    { month: '2025-02', paid: true,  paidDate: '2025-02-01' },
    { month: '2025-03', paid: true,  paidDate: '2025-03-03' },
    { month: '2025-04', paid: true,  paidDate: '2025-04-01' },
    { month: '2025-05', paid: true,  paidDate: '2025-05-02' },
    { month: '2025-06', paid: false, paidDate: null },
  ]

  for (const pm of paymentMonths) {
    await prisma.payment.create({
      data: {
        contractId: contract.id,
        tenantId: tenantRecord.id,
        landlordId: landlord1.id,
        amount: 5500000,
        dueDate: new Date(`${pm.month}-01`),
        status: pm.paid ? 'PAID' : 'PENDING',
        ...(pm.paid && pm.paidDate ? { paidDate: new Date(pm.paidDate) } : {}),
        note: `Tiền thuê tháng ${pm.month}`,
      },
    })
  }

  // ─── Demo: Tenant 2 + Contract cho l9 (Hà Nội) ──────────────
  const tenantRecord2 = await prisma.tenant.create({
    data: {
      landlordId: landlord3.id,
      listingId: l9.id,
      userId: tenantUser2.id,
      name: 'Hoàng Văn Em',
      email: 'tenant2@rentnest.com',
      phone: '0904000004',
      moveInDate: new Date('2025-03-01'),
      status: 'ACTIVE',
    },
  })

  const contract2 = await prisma.contract.create({
    data: {
      landlordId: landlord3.id,
      tenantId: tenantRecord2.id,
      listingId: l9.id,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-08-31'),
      rentAmount: 11000000,
      depositAmount: 22000000,
      terms: 'Hợp đồng 6 tháng. Thanh toán vào ngày 1 mỗi tháng.',
      status: 'ACTIVE',
    },
  })

  await prisma.payment.createMany({
    data: [
      { contractId: contract2.id, tenantId: tenantRecord2.id, landlordId: landlord3.id, amount: 11000000, dueDate: new Date('2025-03-01'), status: 'PAID', paidDate: new Date('2025-03-02'), note: 'Tháng 3' },
      { contractId: contract2.id, tenantId: tenantRecord2.id, landlordId: landlord3.id, amount: 11000000, dueDate: new Date('2025-04-01'), status: 'PAID', paidDate: new Date('2025-04-01'), note: 'Tháng 4' },
      { contractId: contract2.id, tenantId: tenantRecord2.id, landlordId: landlord3.id, amount: 11000000, dueDate: new Date('2025-05-01'), status: 'PAID', paidDate: new Date('2025-05-03'), note: 'Tháng 5' },
      { contractId: contract2.id, tenantId: tenantRecord2.id, landlordId: landlord3.id, amount: 11000000, dueDate: new Date('2025-06-01'), status: 'PENDING', note: 'Tháng 6' },
    ],
  })

  // ─── Demo: Đánh giá ───────────────────────────────────────────
  // Tạo tenant đã dọn ra (moveOutDate trong quá khứ) để có thể review
  // userId = null vì cùng user chỉ được có 1 bản ghi tenant active (unique constraint)
  const oldTenant = await prisma.tenant.create({
    data: {
      landlordId: landlord2.id,
      listingId: l5.id,
      userId: null,
      name: 'Phạm Thị Dung',
      email: 'tenant@rentnest.com',
      phone: '0901000003',
      moveInDate: new Date('2024-01-01'),
      moveOutDate: new Date('2024-12-31'),
      status: 'MOVED_OUT',
    },
  })

  await prisma.review.create({
    data: {
      tenantId: oldTenant.id,
      listingId: l5.id,
      rating: 5,
      text: 'Phòng rất đẹp và sạch sẽ, chủ nhà thân thiện, nhiệt tình hỗ trợ. Vị trí cực kỳ thuận tiện. Sẽ giới thiệu cho bạn bè!',
      isVerified: true,
      status: 'PUBLISHED',
    },
  })

  const oldTenant2 = await prisma.tenant.create({
    data: {
      landlordId: landlord2.id,
      listingId: l5.id,
      userId: null,
      name: 'Hoàng Văn Em',
      email: 'tenant2@rentnest.com',
      phone: '0904000004',
      moveInDate: new Date('2024-03-01'),
      moveOutDate: new Date('2024-09-30'),
      status: 'MOVED_OUT',
    },
  })

  await prisma.review.create({
    data: {
      tenantId: oldTenant2.id,
      listingId: l5.id,
      rating: 4,
      text: 'Căn hộ ổn, đầy đủ tiện nghi. Điểm trừ là thang máy đôi khi chậm. Nhìn chung vẫn rất đáng tiền.',
      isVerified: true,
      status: 'PUBLISHED',
    },
  })

  await prisma.review.create({
    data: {
      tenantId: oldTenant.id,
      listingId: l7.id,
      rating: 5,
      text: 'View biển cực đẹp! Buổi sáng ngắm bình minh từ ban công thật tuyệt vời. Chủ nhà dễ tính, phòng luôn sạch sẽ.',
      isVerified: true,
      status: 'PUBLISHED',
    },
  })

  // Cập nhật avgRating cho l5 và l7
  await prisma.listing.update({ where: { id: l5.id }, data: { viewCount: 142 } })
  await prisma.listing.update({ where: { id: l7.id }, data: { viewCount: 87 } })
  await prisma.listing.update({ where: { id: l1.id }, data: { viewCount: 203 } })
  await prisma.listing.update({ where: { id: l9.id }, data: { viewCount: 165 } })
  await prisma.listing.update({ where: { id: l11.id }, data: { viewCount: 94 } })
  await prisma.listing.update({ where: { id: l14.id }, data: { viewCount: 211 } })

  console.log('✅ Seed completed!')
  console.log('')
  console.log('   👤 Accounts:')
  console.log('   Admin:      admin@rentnest.com     / Admin@123')
  console.log('   Landlord 1: landlord@rentnest.com  / Admin@123  (HCM - 5 phòng)')
  console.log('   Landlord 2: landlord2@rentnest.com / Admin@123  (HCM + Đà Nẵng - 5 phòng)')
  console.log('   Landlord 3: landlord3@rentnest.com / Admin@123  (Hà Nội - 5 phòng)')
  console.log('   Tenant 1:   tenant@rentnest.com    / Admin@123  (đang thuê Quận 1)')
  console.log('   Tenant 2:   tenant2@rentnest.com   / Admin@123  (đang thuê Cầu Giấy HN)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
