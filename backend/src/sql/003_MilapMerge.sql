CREATE TABLE public.feedbacks (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

ALTER TABLE events 
ADD COLUMN is_paid_event BOOLEAN DEFAULT FALSE,
ADD COLUMN ticket_price NUMERIC(10,2) DEFAULT 0,
ADD COLUMN platform_fee_paid NUMERIC(10,2) DEFAULT 0,
ADD COLUMN razorpay_order_id VARCHAR(255),
ADD COLUMN razorpay_payment_id VARCHAR(255),
ADD COLUMN razorpay_signature VARCHAR(255),
ADD COLUMN payment_status VARCHAR(50) DEFAULT 'free';

ALTER TABLE organizations 
ADD COLUMN razorpay_account_id VARCHAR(255),
ADD COLUMN kyc_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE events 
ADD COLUMN refund_id VARCHAR(255);