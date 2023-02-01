# start the server

- cd server
- npm install
- npm run build && npm run dev

# start the client-server
- cd ../client
- npm install
- npm start


# events -> http://localhost:8080
## users
- user:register
- user:register:success
- user:register:fail

- user:login
- user:login:success
- user:login:fail

- token:refresh
- token:refresh:success
- token:refresh:fail

## game
- game:create-bot
- game:create-bot:success
- game:create-bot:fail

- game:over
- game:over:fail          [only for developer to track the error]

## player
- player:move-possible
- player:move-possible:success
- player:move-possible:fail

- player:move
- player:move:success
- player:move:fail


# browser -> http://localhost:3000
