const pool = require('../config/db');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories';
    const values = [];

    if (type) {
      query += ' WHERE type = ?';
      values.push(type);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.execute(query, values);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Create a category
exports.createCategory = async (req, res) => {
  try {
    const { name, type = 'PRODUCT' } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (name, type) VALUES (?, ?) RETURNING id',
      [name, type]
    );

    res.status(201).json({ 
      message: 'Category created', 
      categoryId: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const [result] = await pool.execute(
      'UPDATE categories SET name = COALESCE(?, name), type = COALESCE(?, type) WHERE id = ?',
      [name, type, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category name already exists for this type' });
    }
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
