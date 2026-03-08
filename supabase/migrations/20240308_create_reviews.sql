-- Create reviews table
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  student_id uuid references auth.users(id) on delete cascade not null,
  service_id uuid references items(id) on delete set null, -- Optional link to specific service
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table reviews enable row level security;

create policy "Reviews are viewable by everyone if approved"
  on reviews for select
  using (is_approved = true);

create policy "Users can view their own reviews"
  on reviews for select
  using (auth.uid() = student_id);

create policy "Admins can view all reviews"
  on reviews for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Users can create reviews for their own completed orders"
  on reviews for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from orders
      where orders.id = order_id
      and orders.student_id = auth.uid()
      and orders.status = 'Završeno'
    )
  );

create policy "Admins can update reviews (approve/moderate)"
  on reviews for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Add indexes
create index reviews_order_id_idx on reviews(order_id);
create index reviews_service_id_idx on reviews(service_id);
create index reviews_is_approved_idx on reviews(is_approved);
