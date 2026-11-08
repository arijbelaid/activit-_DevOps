-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
