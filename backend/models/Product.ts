export class Product {
  id?: number;
  name: string;

  constructor(data: { id?: number; name: string }) {
    this.id = data.id;
    this.name = data.name;
  }

  static fromDatabase(data: any): Product {
    return new Product({
      id: data.id,
      name: data.name,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
    };
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim() === "") {
      errors.push("Product name is required");
    }

    if (this.name && this.name.length > 255) {
      errors.push("Product name cannot exceed 255 characters");
    }

    return errors;
  }
}
