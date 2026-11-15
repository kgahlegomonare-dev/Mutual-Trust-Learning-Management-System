import { useState, useEffect, useMemo } from 'react';
import { centerService } from '../services/centerService';

export function useCenters() {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Search states to manage UI filter bars
    const [searchName, setSearchName] = useState('');
    const [searchProvince, setSearchProvince] = useState('');

    // 1. Initial Load: Fetch all centers on component mount
    const fetchCenters = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await centerService.getAllCenters();
            setCenters(data);
        } catch (err) {
            setError(err.message || 'Something went wrong fetching centers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCenters();
    }, []);

    // 2. Client-Side Filter: Instant search by name or province without reloading from the DB
    const filteredCenters = useMemo(() => {
        return centers.filter(center => {
            const matchesName = center.center_name
                .toLowerCase()
                .includes(searchName.toLowerCase().trim());
                
            const matchesProvince = center.center_province
                .toLowerCase()
                .includes(searchProvince.toLowerCase().trim());
                
            return matchesName && matchesProvince;
        });
    }, [centers, searchName, searchProvince]);

    // 3. Action Wrapper: Create a new center and refresh list
    const createNewCenter = async (centerData) => {
        setLoading(true);
        try {
            const result = await centerService.createCenter(centerData);
            // Re-fetch or locally append to state to keep UI in sync
            await fetchCenters();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 4. Action Wrapper: Update center details
    const modifyCenter = async (id, updatedData) => {
        setLoading(true);
        try {
            const result = await centerService.updateCenter(id, updatedData);
            await fetchCenters();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 5. Action Wrapper: Soft-deactivate a center
    const disableCenter = async (id, reason) => {
        setLoading(true);
        try {
            const result = await centerService.deactivateCenter(id, reason);
            await fetchCenters();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        // Data states
        centers,
        filteredCenters,
        loading,
        error,
        
        // Search inputs state setters
        searchName,
        setSearchName,
        searchProvince,
        setSearchProvince,
        
        // CRUD Request Functions
        refreshCenters: fetchCenters,
        createNewCenter,
        modifyCenter,
        disableCenter
    };
}