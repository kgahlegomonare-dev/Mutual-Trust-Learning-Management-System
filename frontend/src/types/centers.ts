export interface Center {
    center_id: number;
    center_name: string;
    center_address: string;
    center_capacity: number;
    center_province: string;
    is_active: boolean;
    reason_for_deactivation: string | null;
    created_at?: string;
}

export interface CreateCenterDTO {
    center_name: string;
    location_address: string; // Matches the naming expectation of your controller body
    center_capacity: number;
    province: string;         // Matches the naming expectation of your controller body
}

export interface UpdateCenterDTO {
    center_name: string;
    location_address: string;
    center_capacity: number;
    province: string;
}