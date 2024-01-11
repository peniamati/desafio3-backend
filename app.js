const fs = require('fs').promises;
const express = require('express');

class ProductManager {
  constructor(filePath) {
    this.path = filePath;
    this.lastProductId = 0;
  }

  async initialize() {
    try {
      const data = await fs.readFile(this.path, 'utf8');
      this.products = JSON.parse(data) || [];
      this.lastProductId = this.calculateLastId();
    } catch (error) {
      this.products = [];
      this.lastProductId = 0;
    }
  }

  calculateLastId() {
    const lastProduct = this.products[this.products.length - 1];
    return lastProduct ? lastProduct.id : 0;
  }

  async readFromFile() {
    try {
      const data = await fs.readFile(this.path, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async writeToFile() {
    const data = JSON.stringify(this.products, null, 2);
    await fs.writeFile(this.path, data);
  }

  async addProduct(product) {
    const { title, description, price, thumbnail, code, stock } = product;

    if (!title || !description || !price || !thumbnail || !code || !stock) {
      console.log("Todos los campos son obligatorios");
      return;
    }

    if (this.products.some(existingProduct => existingProduct.code === code)) {
      throw new Error("El código ya existe");
    }

    const newProduct = {
      id: ++this.lastProductId,
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
    };

    this.products.push(newProduct);
    await this.writeToFile();
  }

  getProducts(limit) {
    return limit ? this.products.slice(0, limit) : this.products;
  }

  async getProductById(id) {
    const product = this.products.find(product => product.id === id);
    if (!product) {
      throw new Error("El producto no existe");
    }
    return product;
  }

  async updateProduct(id, updatedProduct) {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) {
      throw new Error("El producto no existe");
    }

    this.products[index] = { ...this.products[index], ...updatedProduct };
    await this.writeToFile();
  }

  async deleteProduct(id) {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) {
      throw new Error("El producto no existe");
    }

    this.products.splice(index, 1);
    await this.writeToFile();
  }
}

const app = express();
const port = 8080;
const productManager = new ProductManager('productos.json');

app.use(express.json());

app.get('/products', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    await productManager.initialize();
    const products = productManager.getProducts(limit);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/products/:pid', async (req, res) => {
  try {
    const productId = parseInt(req.params.pid);
    await productManager.initialize();
    const product = await productManager.getProductById(productId);
    res.json({ product });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
