export class ProductPrice {
  id?: number;
  product_id: number;
  price: number;
  timestamp: string;

  constructor(data: {
    id?: number;
    product_id: number;
    price: number;
    timestamp?: string;
  }) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.price = data.price;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  static fromDatabase(data: any): ProductPrice {
    return new ProductPrice({
      id: data.id,
      product_id: data.product_id,
      price: data.price,
      timestamp: data.timestamp,
    });
  }

  toJSON() {
    return {
      id: this.id,
      product_id: this.product_id,
      price: this.price,
      timestamp: this.timestamp,
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.product_id || this.product_id <= 0) {
      errors.push("Product ID is required and must be greater than 0");
    }

    if (this.price === undefined || this.price < 0) {
      errors.push("Price is required and cannot be negative");
    }

    if (!this.timestamp || this.timestamp.trim() === "") {
      errors.push("Timestamp is required");
    }

    return errors;
  }

  isPriceZero(): boolean {
    return this.price === 0;
  }

  getPriceFormatted(): string {
    return this.price.toFixed(2);
  }
}
