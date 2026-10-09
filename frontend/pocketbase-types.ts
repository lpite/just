/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export const Collections = {
	Authorigins: "_authOrigins",
	Externalauths: "_externalAuths",
	Mfas: "_mfas",
	Otps: "_otps",
	Superusers: "_superusers",
	Brand: "brand",
	Category: "category",
	Client: "client",
	IncomeDocument: "income_document",
	IncomeDocumentItem: "income_document_item",
	PriceSettingDocument: "price_setting_document",
	PriceSettingDocumentProduct: "price_setting_document_product",
	Product: "product",
	ProductPrice: "product_price",
	ProductPriceLatest: "product_price_latest",
	ProductStock: "product_stock",
	ProductStockHistory: "product_stock_history",
	ProductStockLatest: "product_stock_latest",
	ProductsWithStockAndPrice: "products_with_stock_and_price",
	SalesDocument: "sales_document",
	SalesDocumentItem: "sales_document_item",
	StoragePlace: "storage_place",
	Supplier: "supplier",
	Users: "users",
	Warehouse: "warehouse",
} as const
export type Collections = typeof Collections[keyof typeof Collections]

// Alias types for improved usability
export type IsoDateString = string
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated: IsoAutoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated: IsoAutoDateString
}

export type MfasRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	method: string
	recordRef: string
	updated: IsoAutoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated: IsoAutoDateString
}

export type SuperusersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type BrandRecord = {
	created: IsoAutoDateString
	id: string
	name: string
	updated: IsoAutoDateString
}

export type CategoryRecord = {
	created: IsoAutoDateString
	id: string
	name: string
	parent_id?: RecordIdString
	updated: IsoAutoDateString
}

export type ClientRecord = {
	created: IsoAutoDateString
	id: string
	name?: string
	updated: IsoAutoDateString
}

export type IncomeDocumentRecord = {
	comment?: string
	created: IsoAutoDateString
	date?: IsoDateString
	id: string
	posted?: boolean
	supplier?: RecordIdString
	supplier_document_id?: string
	warehouse?: RecordIdString
}

export type IncomeDocumentItemRecord = {
	created: IsoAutoDateString
	document: RecordIdString
	id: string
	price: number
	product: RecordIdString
	quantity: number
	updated: IsoAutoDateString
}

export type PriceSettingDocumentRecord = {
	created: IsoAutoDateString
	date?: IsoDateString
	id: string
	posted?: boolean
	updated: IsoAutoDateString
}

export type PriceSettingDocumentProductRecord = {
	created: IsoAutoDateString
	document_id: RecordIdString
	id: string
	price?: number
	product_id: RecordIdString
	updated: IsoAutoDateString
}

export type ProductRecord = {
	article?: string
	brand?: RecordIdString
	description?: string
	id: string
	name: string
	name_for_print?: string
	name_for_web?: string
	oem?: string
	photos?: FileNameString[]
	places?: RecordIdString[]
	suppliers?: RecordIdString[]
}

export type ProductPriceRecord = {
	date?: IsoDateString
	document: RecordIdString
	id: string
	price: number
	product: RecordIdString
}

export type ProductPriceLatestRecord<Tprice = unknown> = {
	id: string
	price?: null | Tprice
}

export const ProductStockDocumentTypeOptions = {
	"income": "income",
	"sales": "sales",
} as const
export type ProductStockDocumentTypeOptions = typeof ProductStockDocumentTypeOptions[keyof typeof ProductStockDocumentTypeOptions]
export type ProductStockRecord = {
	date: IsoDateString
	document: string
	document_type: ProductStockDocumentTypeOptions
	id: string
	product: RecordIdString
	quantity: number
}

export type ProductStockHistoryRecord = {
	date: IsoDateString
	id: string
	product: RecordIdString
	quantity: number
}

export type ProductStockLatestRecord<Tstock = unknown> = {
	id: string
	stock?: null | Tstock
}

export type ProductsWithStockAndPriceRecord<Tprice = unknown, Tstock = unknown> = {
	article?: string
	brand?: RecordIdString
	description?: string
	id: string
	name: string
	oem?: string
	photos?: FileNameString[]
	price?: null | Tprice
	stock?: null | Tstock
}

export type SalesDocumentRecord = {
	client: RecordIdString
	comment?: string
	created: IsoAutoDateString
	date: IsoDateString
	id: string
	posted?: boolean
	sum?: number
	updated: IsoAutoDateString
}

export type SalesDocumentItemRecord = {
	created: IsoAutoDateString
	document: RecordIdString
	id: string
	price: number
	product: RecordIdString
	quantity: number
	updated: IsoAutoDateString
}

export type StoragePlaceRecord = {
	created: IsoAutoDateString
	id: string
	name: string
	parent_id?: RecordIdString
	updated: IsoAutoDateString
}

export type SupplierRecord = {
	created: IsoAutoDateString
	id: string
	name: string
	updated: IsoAutoDateString
}

export type UsersRecord = {
	avatar?: FileNameString
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type WarehouseRecord = {
	created: IsoAutoDateString
	id: string
	name?: string
	updated: IsoAutoDateString
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type BrandResponse<Texpand = unknown> = Required<BrandRecord> & BaseSystemFields<Texpand>
export type CategoryResponse<Texpand = unknown> = Required<CategoryRecord> & BaseSystemFields<Texpand>
export type ClientResponse<Texpand = unknown> = Required<ClientRecord> & BaseSystemFields<Texpand>
export type IncomeDocumentResponse<Texpand = unknown> = Required<IncomeDocumentRecord> & BaseSystemFields<Texpand>
export type IncomeDocumentItemResponse<Texpand = unknown> = Required<IncomeDocumentItemRecord> & BaseSystemFields<Texpand>
export type PriceSettingDocumentResponse<Texpand = unknown> = Required<PriceSettingDocumentRecord> & BaseSystemFields<Texpand>
export type PriceSettingDocumentProductResponse<Texpand = unknown> = Required<PriceSettingDocumentProductRecord> & BaseSystemFields<Texpand>
export type ProductResponse<Texpand = unknown> = Required<ProductRecord> & BaseSystemFields<Texpand>
export type ProductPriceResponse<Texpand = unknown> = Required<ProductPriceRecord> & BaseSystemFields<Texpand>
export type ProductPriceLatestResponse<Tprice = unknown, Texpand = unknown> = Required<ProductPriceLatestRecord<Tprice>> & BaseSystemFields<Texpand>
export type ProductStockResponse<Texpand = unknown> = Required<ProductStockRecord> & BaseSystemFields<Texpand>
export type ProductStockHistoryResponse<Texpand = unknown> = Required<ProductStockHistoryRecord> & BaseSystemFields<Texpand>
export type ProductStockLatestResponse<Tstock = unknown, Texpand = unknown> = Required<ProductStockLatestRecord<Tstock>> & BaseSystemFields<Texpand>
export type ProductsWithStockAndPriceResponse<Tprice = unknown, Tstock = unknown, Texpand = unknown> = Required<ProductsWithStockAndPriceRecord<Tprice, Tstock>> & BaseSystemFields<Texpand>
export type SalesDocumentResponse<Texpand = unknown> = Required<SalesDocumentRecord> & BaseSystemFields<Texpand>
export type SalesDocumentItemResponse<Texpand = unknown> = Required<SalesDocumentItemRecord> & BaseSystemFields<Texpand>
export type StoragePlaceResponse<Texpand = unknown> = Required<StoragePlaceRecord> & BaseSystemFields<Texpand>
export type SupplierResponse<Texpand = unknown> = Required<SupplierRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type WarehouseResponse<Texpand = unknown> = Required<WarehouseRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	brand: BrandRecord
	category: CategoryRecord
	client: ClientRecord
	income_document: IncomeDocumentRecord
	income_document_item: IncomeDocumentItemRecord
	price_setting_document: PriceSettingDocumentRecord
	price_setting_document_product: PriceSettingDocumentProductRecord
	product: ProductRecord
	product_price: ProductPriceRecord
	product_price_latest: ProductPriceLatestRecord
	product_stock: ProductStockRecord
	product_stock_history: ProductStockHistoryRecord
	product_stock_latest: ProductStockLatestRecord
	products_with_stock_and_price: ProductsWithStockAndPriceRecord
	sales_document: SalesDocumentRecord
	sales_document_item: SalesDocumentItemRecord
	storage_place: StoragePlaceRecord
	supplier: SupplierRecord
	users: UsersRecord
	warehouse: WarehouseRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	brand: BrandResponse
	category: CategoryResponse
	client: ClientResponse
	income_document: IncomeDocumentResponse
	income_document_item: IncomeDocumentItemResponse
	price_setting_document: PriceSettingDocumentResponse
	price_setting_document_product: PriceSettingDocumentProductResponse
	product: ProductResponse
	product_price: ProductPriceResponse
	product_price_latest: ProductPriceLatestResponse
	product_stock: ProductStockResponse
	product_stock_history: ProductStockHistoryResponse
	product_stock_latest: ProductStockLatestResponse
	products_with_stock_and_price: ProductsWithStockAndPriceResponse
	sales_document: SalesDocumentResponse
	sales_document_item: SalesDocumentItemResponse
	storage_place: StoragePlaceResponse
	supplier: SupplierResponse
	users: UsersResponse
	warehouse: WarehouseResponse
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<{
	// Omit AutoDate fields
	[K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: 
		// Convert FileNameString to File
		T[K] extends infer U ? 
			U extends (FileNameString | FileNameString[]) ? 
				U extends any[] ? File[] : File 
			: U
		: never
}, 'id'>

// Create type for Auth collections
export type CreateAuth<T> = {
	id?: RecordIdString
	email: string
	emailVisibility?: boolean
	password: string
	passwordConfirm: string
	verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
	id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
	email?: string
	emailVisibility?: boolean
	oldPassword?: string
	password?: string
	passwordConfirm?: string
	verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? CreateAuth<CollectionRecords[T]>
		: CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? UpdateAuth<CollectionRecords[T]>
		: UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
	collection<T extends keyof CollectionResponses>(
		idOrName: T
	): RecordService<CollectionResponses[T]>
} & PocketBase
