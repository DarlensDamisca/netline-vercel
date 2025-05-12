type Item = {
  _id?: string;
  name: string;
};

const API_BASE_URL = '/api';

export const fetchItems = async (table: string): Promise<Item[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/item?table=${table}`);
    console.log(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const createItem = async (table: string, item: Omit<Item, '_id'>): Promise<Item> => {
  try {
    const response = await fetch(`${API_BASE_URL}/item?table=${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};
