  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase().trim();
    setSearchQuery(query);
    
    if (query) {
      const filtered = medicines.filter((medicine) => {
        // Search in all CSV columns using the column names from the CSV file
        const searchableFields = [
          medicine['Medicine name'],
          medicine['Medicine Type'],
          medicine['Dosage'],
          medicine['Composition']
        ];
        
        return searchableFields.some(field => 
          field && field.toLowerCase().includes(query)
        );
      });
      console.log('Search query:', query, 'Results:', filtered.length);
      setFilteredMedicines(filtered);
    } else {
      setFilteredMedicines(medicines);
    }
  };
