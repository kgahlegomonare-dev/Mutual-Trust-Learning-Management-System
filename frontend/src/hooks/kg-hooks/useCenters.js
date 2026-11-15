import { useState, useEffect } from "react";
import * as centerService from "../../services/kgs-services/centerService";

export default function useCenters(enabled = true) {

    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(enabled);

    useEffect(() => {

        if (!enabled) {
            setCenters([]);
            setLoading(false);
            return;
        }

        const fetchCenters = async () => {

            try {

                const data = await centerService.getCenters();

                setCenters(data);

            } catch (err) {

                console.error(err);

            } finally {

                setLoading(false);

            }

        };

        fetchCenters();

    }, [enabled]);

    return {

        centers,
        loading

    };

}