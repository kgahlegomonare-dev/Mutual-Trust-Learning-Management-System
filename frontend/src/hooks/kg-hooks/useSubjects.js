import { useState, useEffect } from "react";
import * as subjectService from "../../services/kgs-services/subjectService";

export default function useSubjects(enabled = true) {

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(enabled);

    useEffect(() => {

        if (!enabled) {
            setSubjects([]);
            setLoading(false);
            return;
        }

        const fetchSubjects = async () => {

            try {

                const data = await subjectService.getAllSubjects();

                setSubjects(data);

            } catch (err) {

                console.error(err);

            } finally {

                setLoading(false);

            }

        };

        fetchSubjects();

    }, [enabled]);

    return {

        subjects,
        loading

    };

}