export interface PriceSettingDocumentItem {
  id?: number;
  document_id?: number;
  product_id: number;
  price: number;
}

export class PriceSettingDocument {
  id?: number;
  date: string;
  posted: boolean;
  items?: PriceSettingDocumentItem[];

  constructor(data: {
    id?: number;
    date: string;
    posted?: boolean;
    items?: PriceSettingDocumentItem[];
  }) {
    this.id = data.id;
    this.date = data.date;
    this.posted = data.posted ?? false;
    this.items = data.items || [];
  }

  static fromDatabase(data: any, items?: any[]): PriceSettingDocument {
    return new PriceSettingDocument({
      id: data.id,
      date: data.date,
      posted: data.posted,
      items: items || [],
    });
  }

  toJSON() {
    return {
      id: this.id,
      date: this.date,
      posted: this.posted,
      items: this.items,
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.date || this.date.trim() === "") {
      errors.push("Document date is required");
    }

    if (!this.items || this.items.length === 0) {
      errors.push("At least one item is required");
    }

    this.items?.forEach((item, index) => {
      if (!item.product_id || item.product_id <= 0) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (item.price === undefined || item.price < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`);
      }
    });

    return errors;
  }

  getItemCount(): number {
    return this.items?.length || 0;
  }

  getAveragePrice(): number {
    if (!this.items || this.items.length === 0) return 0;
    const totalPrice = this.items.reduce((sum, item) => sum + item.price, 0);
    return totalPrice / this.items.length;
  }

  getMinPrice(): number {
    if (!this.items || this.items.length === 0) return 0;
    return Math.min(...this.items.map((item) => item.price));
  }

  getMaxPrice(): number {
    if (!this.items || this.items.length === 0) return 0;
    return Math.max(...this.items.map((item) => item.price));
  }
}
