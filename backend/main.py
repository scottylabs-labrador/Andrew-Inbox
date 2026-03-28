
# On user login or sync
# 1. get user id
# 2. retrieve canvas token from user id and verify its a valid user_id
# 3. call scrape piazza, gradescope and canvas with canvas token
# 4. upload all of them to supabase
# 5. Call function to update UI

send_piazza_to_supabase(user_id, CANVAS_API_KEY)