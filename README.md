# NestJS FULL AUTH boilerplate

## Description

NestJS boilerplate, Auth, TypeORM, MySql, Mailing, Google OAuth20

## Table of Contents

- [Features](#features)
- [Quick run](#quick-run)
- [Links](#links)

## Features

- [x] Database ([typeorm](https://www.npmjs.com/package/typeorm)).
- [x] Config Service ([@nestjs/config](https://www.npmjs.com/package/@nestjs/config)).
- [x] Mailing ([nodemailer](https://www.npmjs.com/package/nodemailer)).
- [x] Sign in and sign up via email.
- [x] Confirm account via email verification.
- [x] Forget password.
- [x] Reset password.
- [x] Refresh token.
- [x] Google OAuth20.
- [x] Swagger.

## Quick run

```bash
git clone  https://github.com/RamezTaher/nestjs-full-auth
cd nestjs-full-auth
npm install
cp env-example .env

[1st Way]
npm run dev

OR

[2nd Way]
npm run start:dev
npm run maildev

```

## Links

- Swagger: <http://localhost:5000/docs>
