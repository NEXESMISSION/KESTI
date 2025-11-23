-- Credit Customers Table
create table credit_customers (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamp with time zone default now()
);

-- Credit Sales Table
create table credit_sales (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references credit_customers(id) on delete cascade,
  total_amount numeric not null,
  paid_amount numeric default 0,
  remaining_amount numeric not null,
  is_paid boolean default false,
  created_at timestamp with time zone default now(),
  paid_at timestamp with time zone
);

-- Credit Sale Items Table
create table credit_sale_items (
  id uuid primary key default uuid_generate_v4(),
  credit_sale_id uuid references credit_sales(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  quantity numeric not null,
  price_at_sale numeric not null,
  cost_price_at_sale numeric default 0,
  created_at timestamp with time zone default now()
);