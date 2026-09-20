export interface IncomeDocumentItem {
  id?: number;
  document_id?: number;
  product_id: number;
  price: number;
  quantity: number;
}

export class IncomeDocument {
  id?: number;
  date: string;
  partner_id: number;
  posted: boolean;
  items?: IncomeDocumentItem[];

  constructor(data: {
    id?: number;
    date: string;
    partner_id: number;
    posted?: boolean;
    items?: IncomeDocumentItem[];
  }) {
    this.id = data.id;
    this.date = data.date;
    this.partner_id = data.partner_id;
    this.posted = data.posted ?? false;
    this.items = data.items || [];
  }

  static fromDatabase(data: any, items?: any[]): IncomeDocument {
    return new IncomeDocument({
      id: data.id,
      date: data.date,
      partner_id: data.partner_id,
      posted: data.posted,
      items: items || [],
    });
  }

  toJSON() {
    return {
      id: this.id,
      date: this.date,
      partner_id: this.partner_id,
      posted: this.posted,
      items: this.items,
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.date || this.date.trim() === "") {
      errors.push("Document date is required");
    }

    if (!this.partner_id || this.partner_id <= 0) {
      errors.push("Partner ID is required and must be greater than 0");
    }

    if (!this.items || this.items.length === 0) {
      errors.push("At least one item is required");
    }

    this.items?.forEach((item, index) => {
      if (!item.product_id || item.product_id <= 0) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (item.quantity === undefined || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.price === undefined || item.price < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`);
      }
    });

    return errors;
  }

  getTotalAmount(): number {
    return this.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  }

  getItemCount(): number {
    return this.items?.length || 0;
  }
}
