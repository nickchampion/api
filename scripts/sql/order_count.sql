
select 
  order_count, 
  user_count,
  sum(user_count) over(order by order_count desc)
from (
  select
    distinct(count) as order_count,
    count(count) as user_count
  from
    (
      select
        count(zte_orders.[id]) as count
      from
        (
          SELECT
            T0.[id] AS [id],
            T0.[userId] AS [user_id]
          FROM
            [zte].[orders] T0
        ) AS zte_orders
      group by
        zte_orders.[user_id]
    ) order_count
  group by
    count
) orders
