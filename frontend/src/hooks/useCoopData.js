import { useState } from 'react';
import axios from 'axios';

export const useCoopData = (initialData = {}) => {
  const [coopData, setCoopData] = useState(initialData);

  const updateCoopData = (newData) => {
    setCoopData((prev) => ({ ...prev, ...newData }));
  };

  const saveCoopData = async (id) => {
    try {
      // id would normally be the ID obtained from auth or the successful registration
      const response = await axios.put(`/api/cooperative/${id || 'me'}`, coopData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { coopData, updateCoopData, saveCoopData };
};
