import { useState, useEffect } from "react";
import * as classService from "../../services/kgs-services/classService";

export default function useClasses(enabled = true) {

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(enabled);

    useEffect(() => {

        if (!enabled) {
            setClasses([]);
            setLoading(false);
            return;
        }

        const fetchClasses = async () => {

            try {

                const data = await classService.getClasses();

                setClasses(data);

            } catch (err) {

                console.error(err);

            } finally {

                setLoading(false);

            }

        };

        fetchClasses();

    }, [enabled]);

    return {

        classes,
        loading

    };

}