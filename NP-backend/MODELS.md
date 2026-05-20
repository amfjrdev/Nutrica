# NP-Backend — Database Models & Relations

> **Framework:** ASP.NET Core 8 · **ORM:** Entity Framework Core · **Database:** SQL Server  
> **Architecture:** Clean Architecture · All primary keys are `Guid`

---

## Table of Contents

1. [User](#1-user)
2. [Admin](#2-admin)
3. [Client](#3-client)
4. [Nutritionist](#4-nutritionist)
5. [Appointment](#5-appointment)
6. [NutritionPlan](#6-nutritionplan)
7. [Post](#7-post)
8. [Subscription](#8-subscription)
9. [Payment](#9-payment)
10. [Notification](#10-notification)
11. [Feedback](#11-feedback)
12. [Relations Between Tables](#12-relations-between-tables)
13. [Entity Relationship Diagram (Text)](#13-entity-relationship-diagram-text)

---

## 1. User

**Table:** `Users`  
**Description:** Base account for all actors (Admin, Client, Nutritionist). Role is stored as a string field.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `Email` | `string` (max 256) | NO | Unique |
| `FirstName` | `string` (max 50) | NO | |
| `LastName` | `string` (max 50) | NO | |
| `PhoneNumber` | `string?` (max 20) | YES | |
| `PasswordHash` | `string` | NO | BCrypt hash |
| `Role` | `string` (max 20) | NO | `Admin` / `Client` / `Nutritionist` |
| `IsActive` | `bool` | NO | Default: `true` |
| `IsSuspended` | `bool` | NO | Default: `false` |
| `CreatedAt` | `DateTime` | NO | UTC |
| `UpdatedAt` | `DateTime?` | YES | UTC |

---

## 2. Admin

**Table:** `Admins`  
**Description:** Profile record for users with the Admin role.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `UserId` | `Guid` | NO | FK → `Users.Id` |
| `CreatedAt` | `DateTime` | NO | UTC |

---

## 3. Client

**Table:** `Clients`  
**Description:** Profile record for users with the Client role. Stores nutrition questionnaire data.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `UserId` | `Guid` | NO | FK → `Users.Id` |
| `Goal` | `string?` (max 500) | YES | e.g. "Lose weight" |
| `MedicalConditions` | `string?` | YES | |
| `FoodAllergies` | `string?` | YES | |
| `ActivityLevel` | `string?` (max 50) | YES | e.g. "Sedentary" |
| `Weight` | `decimal?` (5,2) | YES | kg |
| `Height` | `decimal?` (5,2) | YES | cm |
| `Age` | `int?` | YES | |
| `Gender` | `string?` (max 20) | YES | |
| `QuestionnaireCompleted` | `bool` | NO | Default: `false` |
| `CreatedAt` | `DateTime` | NO | UTC |
| `UpdatedAt` | `DateTime?` | YES | UTC |

---

## 4. Nutritionist

**Table:** `Nutritionists`  
**Description:** Profile record for users with the Nutritionist role.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `UserId` | `Guid` | NO | FK → `Users.Id` |
| `Bio` | `string?` (max 1000) | YES | |
| `Specialization` | `string?` (max 200) | YES | |
| `CertificateUrl` | `string?` (max 500) | YES | |
| `IsApproved` | `bool` | NO | Default: `false` |
| `CreatedAt` | `DateTime` | NO | UTC |
| `UpdatedAt` | `DateTime?` | YES | UTC |

---

## 5. Appointment

**Table:** `Appointments`  
**Description:** Booking between a Client and a Nutritionist. Supports real-time chat and video via SignalR hubs.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `ClientId` | `Guid` | NO | FK → `Clients.Id` |
| `NutritionistId` | `Guid` | NO | FK → `Nutritionists.Id` |
| `ScheduledAt` | `DateTime` | NO | Must be in the future |
| `Notes` | `string?` (max 500) | YES | |
| `RejectionReason` | `string?` (max 500) | YES | |
| `Status` | `string` (max 20) | NO | Enum: `Pending` / `Approved` / `Rejected` / `Cancelled` / `Attended` |
| `CreatedAt` | `DateTime` | NO | UTC |
| `UpdatedAt` | `DateTime?` | YES | UTC |

---

## 6. NutritionPlan

**Table:** `NutritionPlans`  
**Description:** A nutrition plan created by a Nutritionist. Can be personalized (for a specific Client) or predefined (public template).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `NutritionistId` | `Guid` | NO | FK → `Nutritionists.Id` |
| `ClientId` | `Guid?` | YES | FK → `Clients.Id` — null if predefined |
| `Title` | `string` (max 200) | NO | |
| `Content` | `string` | NO | Full plan content |
| `IsPredefined` | `bool` | NO | `true` = public template |
| `RejectionReason` | `string?` (max 500) | YES | |
| `Status` | `string` (max 20) | NO | Enum: `Draft` / `PendingApproval` / `Approved` / `Rejected` |
| `CreatedAt` | `DateTime` | NO | UTC |
| `UpdatedAt` | `DateTime?` | YES | UTC |

---

## 7. Post

**Table:** `Posts`  
**Description:** Community post created by a Client or Nutritionist. Requires admin approval before publishing.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `AuthorId` | `Guid` | NO | FK → `Users.Id` |
| `AuthorRole` | `string` (max 20) | NO | `Client` or `Nutritionist` |
| `Title` | `string` (max 200) | NO | |
| `Content` | `string` | NO | |
| `ImageUrl` | `string?` (max 500) | YES | |
| `RejectionReason` | `string?` (max 500) | YES | |
| `Status` | `string` (max 20) | NO | Enum: `PendingApproval` / `Approved` / `Rejected` |
| `CreatedAt` | `DateTime` | NO | UTC |
| `UpdatedAt` | `DateTime?` | YES | UTC |

---

## 8. Subscription

**Table:** `Subscriptions`  
**Description:** A client's active subscription to the platform. Can be linked to a specific Nutritionist or a predefined NutritionPlan.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `ClientId` | `Guid` | NO | FK → `Clients.Id` |
| `NutritionistId` | `Guid?` | YES | FK → `Nutritionists.Id` — for personalized plans |
| `NutritionPlanId` | `Guid?` | YES | FK → `NutritionPlans.Id` — for predefined plans |
| `Type` | `string` (max 20) | NO | Enum: `Predefined` / `Personalized` |
| `Status` | `string` (max 20) | NO | Enum: `Active` / `Expired` / `Cancelled` |
| `StartsAt` | `DateTime` | NO | UTC |
| `ExpiresAt` | `DateTime` | NO | UTC |
| `CreatedAt` | `DateTime` | NO | UTC |

---

## 9. Payment

**Table:** `Payments`  
**Description:** Stripe payment record linked to a Subscription. Tracks payment lifecycle.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `ClientId` | `Guid` | NO | FK → `Clients.Id` |
| `SubscriptionId` | `Guid` | NO | FK → `Subscriptions.Id` |
| `Amount` | `decimal` (10,2) | NO | |
| `Currency` | `string` (max 10) | NO | e.g. `usd` |
| `StripePaymentIntentId` | `string` (max 200) | NO | Unique — from Stripe API |
| `Status` | `string` (max 20) | NO | Enum: `Pending` / `Succeeded` / `Failed` |
| `CreatedAt` | `DateTime` | NO | UTC |
| `PaidAt` | `DateTime?` | YES | UTC — set when Succeeded |

---

## 10. Notification

**Table:** `Notifications`  
**Description:** In-app notification sent to any user (Admin, Client, or Nutritionist).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `UserId` | `Guid` | NO | FK → `Users.Id` |
| `Title` | `string` (max 200) | NO | |
| `Message` | `string` (max 1000) | NO | |
| `IsRead` | `bool` | NO | Default: `false` |
| `CreatedAt` | `DateTime` | NO | UTC |

---

## 11. Feedback

**Table:** `Feedbacks`  
**Description:** Rating and comment submitted by a Client for a NutritionPlan.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `Id` | `Guid` | NO | Primary Key |
| `ClientId` | `Guid` | NO | FK → `Clients.Id` |
| `NutritionPlanId` | `Guid` | NO | FK → `NutritionPlans.Id` |
| `Comment` | `string` (max 1000) | YES | |
| `Rating` | `int` | NO | Range: 1–5 |
| `CreatedAt` | `DateTime` | NO | UTC |

---

## 12. Relations Between Tables

### One-to-One Relations

| Parent Table | Child Table | FK Column | Description |
|---|---|---|---|
| `Users` | `Admins` | `Admins.UserId` | Each Admin has exactly one User account |
| `Users` | `Clients` | `Clients.UserId` | Each Client has exactly one User account |
| `Users` | `Nutritionists` | `Nutritionists.UserId` | Each Nutritionist has exactly one User account |

---

### One-to-Many Relations

| Parent Table | Child Table | FK Column | Description |
|---|---|---|---|
| `Users` | `Notifications` | `Notifications.UserId` | A User receives many Notifications |
| `Users` | `Posts` | `Posts.AuthorId` | A User (Client or Nutritionist) creates many Posts |
| `Clients` | `Appointments` | `Appointments.ClientId` | A Client has many Appointments |
| `Clients` | `Subscriptions` | `Subscriptions.ClientId` | A Client has many Subscriptions (one active at a time) |
| `Clients` | `Payments` | `Payments.ClientId` | A Client has many Payments |
| `Clients` | `Feedbacks` | `Feedbacks.ClientId` | A Client submits many Feedbacks |
| `Nutritionists` | `Appointments` | `Appointments.NutritionistId` | A Nutritionist has many Appointments |
| `Nutritionists` | `NutritionPlans` | `NutritionPlans.NutritionistId` | A Nutritionist creates many NutritionPlans |
| `Nutritionists` | `Subscriptions` | `Subscriptions.NutritionistId` | A Nutritionist is linked to many Subscriptions (optional) |
| `NutritionPlans` | `Feedbacks` | `Feedbacks.NutritionPlanId` | A NutritionPlan receives many Feedbacks |
| `NutritionPlans` | `Subscriptions` | `Subscriptions.NutritionPlanId` | A NutritionPlan is linked to many Subscriptions (optional) |
| `Subscriptions` | `Payments` | `Payments.SubscriptionId` | A Subscription has many Payments |
| `Clients` | `NutritionPlans` | `NutritionPlans.ClientId` | A Client is assigned many NutritionPlans (optional) |

---

### Summary Table

```
Users           1 ──── 1   Admins
Users           1 ──── 1   Clients
Users           1 ──── 1   Nutritionists
Users           1 ──── *   Notifications
Users           1 ──── *   Posts

Clients         1 ──── *   Appointments
Clients         1 ──── *   Subscriptions
Clients         1 ──── *   Payments
Clients         1 ──── *   Feedbacks
Clients         1 ──── *   NutritionPlans   (optional FK)

Nutritionists   1 ──── *   Appointments
Nutritionists   1 ──── *   NutritionPlans
Nutritionists   1 ──── *   Subscriptions    (optional FK)

NutritionPlans  1 ──── *   Feedbacks
NutritionPlans  1 ──── *   Subscriptions    (optional FK)

Subscriptions   1 ──── *   Payments
```

---

## 13. Entity Relationship Diagram (Text)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   Users                                      │
│  PK  Id : Guid                                                               │
│      Email, FirstName, LastName, PhoneNumber?                                │
│      PasswordHash, Role, IsActive, IsSuspended                               │
│      CreatedAt, UpdatedAt?                                                   │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ 1
       ┌───────┼────────────────────────────────────────────┐
       │       │                                            │
       │ 1     │ 1                                          │ 1
       ▼       ▼                                            ▼
  ┌─────────┐ ┌──────────────────────────┐  ┌──────────────────────────────┐
  │ Admins  │ │         Clients          │  │        Nutritionists         │
  │ PK Id   │ │ PK Id                    │  │ PK Id                        │
  │ FK UserId│ │ FK UserId               │  │ FK UserId                    │
  │ CreatedAt│ │ Goal?, MedicalConditions?│  │ Bio?, Specialization?        │
  └─────────┘ │ FoodAllergies?           │  │ CertificateUrl?, IsApproved  │
              │ ActivityLevel?, Weight?  │  │ CreatedAt, UpdatedAt?        │
              │ Height?, Age?, Gender?   │  └──────────┬───────────────────┘
              │ QuestionnaireCompleted   │             │ 1
              │ CreatedAt, UpdatedAt?    │             │
              └──────────┬──────────────┘    ┌────────┴──────────────────────┐
                         │ 1                 │                               │
          ┌──────────────┼──────────────┐    │ *                             │ *
          │ *            │ *            │ *  ▼                               ▼
          ▼              ▼              ▼ ┌──────────────┐    ┌──────────────────────┐
  ┌──────────────┐ ┌──────────────┐ ┌────┤ Appointments │    │    NutritionPlans    │
  │ Subscriptions│ │   Payments   │ │Feed│ FK ClientId  │    │ FK NutritionistId    │
  │ FK ClientId  │ │ FK ClientId  │ │back│ FK Nutritio- │    │ FK ClientId?         │
  │ FK Nutritio- │ │ FK Subscript-│ │    │ nistId       │    │ Title, Content       │
  │ nistId?      │ │ ionId        │ │    │ ScheduledAt  │    │ IsPredefined, Status │
  │ FK NutrPlanId│ │ Amount       │ │    │ Status       │    │ CreatedAt, UpdatedAt?│
  │ Type, Status │ │ Currency     │ │    │ Notes?       │    └──────────┬───────────┘
  │ StartsAt     │ │ StripeIntent │ │    │ CreatedAt    │              │ 1
  │ ExpiresAt    │ │ Status       │ │    └──────────────┘              │
  │ CreatedAt    │ │ CreatedAt    │ │                                  │ *
  └──────────────┘ │ PaidAt?      │ │                                  ▼
                   └──────────────┘ │                        ┌──────────────────┐
                                    │ *                      │    Feedbacks     │
                                    ▼                        │ FK ClientId      │
                             ┌──────────────┐                │ FK NutrPlanId    │
                             │  Feedbacks   │                │ Comment, Rating  │
                             │ FK ClientId  │                │ CreatedAt        │
                             │ FK NutrPlanId│                └──────────────────┘
                             │ Comment      │
                             │ Rating (1-5) │
                             │ CreatedAt    │
                             └──────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              Notifications                                   │
│  PK  Id : Guid                                                               │
│  FK  UserId → Users.Id                                                       │
│      Title, Message, IsRead, CreatedAt                                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                                  Posts                                       │
│  PK  Id : Guid                                                               │
│  FK  AuthorId → Users.Id                                                     │
│      AuthorRole, Title, Content, ImageUrl?                                   │
│      Status (PendingApproval / Approved / Rejected)                          │
│      RejectionReason?, CreatedAt, UpdatedAt?                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Enums Reference

| Enum | Values |
|---|---|
| `AppointmentStatus` | `Pending`, `Approved`, `Rejected`, `Cancelled`, `Attended` |
| `NutritionPlanStatus` | `Draft`, `PendingApproval`, `Approved`, `Rejected` |
| `PostStatus` | `PendingApproval`, `Approved`, `Rejected` |
| `SubscriptionType` | `Predefined`, `Personalized` |
| `SubscriptionStatus` | `Active`, `Expired`, `Cancelled` |
| `PaymentStatus` | `Pending`, `Succeeded`, `Failed` |
