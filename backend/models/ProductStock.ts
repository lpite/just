export class ProductStock {
  id?: number;
  product_id: number;
  quantity: number;
  timestamp: string;

  constructor(data: {
    id?: number;
    product_id: number;
    quantity: number;
    timestamp?: string;
  }) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.quantity = data.quantity;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  static fromDatabase(data: any): ProductStock {
    return new ProductStock({
      id: data.id,
      product_id: data.product_id,
      quantity: data.quantity,
      timestamp: data.timestamp,
    });
  }

  toJSON() {
    return {
      id: this.id,
      product_id: this.product_id,
      quantity: this.quantity,
      timestamp: this.timestamp,
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.product_id || this.product_id <= 0) {
      errors.push("Product ID is required and must be greater than 0");
    }

    if (this.quantity === undefined) {
      errors.push("Quantity is required");
    }

    if (!this.timestamp || this.timestamp.trim() === "") {
      errors.push("Timestamp is required");
    }

    return errors;
  }

  isIncome(): boolean {
    return this.quantity > 0;
  }

  isSale(): boolean {
    return this.quantity < 0;
  }

  getAbsoluteQuantity(): number {
    return Math.abs(this.quantity);
  }
}
