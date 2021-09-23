CREATE TABLE zte.zurl
(
    id INT IDENTITY(1,1) PRIMARY KEY,
    url NVARCHAR(2000) NOT NULL,
    environment NVARCHAR(100) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
)
GO

CREATE TABLE zte.orders
(
    id VARCHAR(32),
    userId VARCHAR(16) NULL,
    code VARCHAR(32) NULL,
    currency VARCHAR(3) NULL,
    orderTotal SMALLMONEY NULL,
    shippingTotal SMALLMONEY NULL,
    discountTotal SMALLMONEY NULL,
    consultationFee SMALLMONEY NULL,
    subTotal SMALLMONEY NULL,
    status VARCHAR(16) NULL,
    discountCode VARCHAR(32) NULL,
    country VARCHAR(2) NULL,
    exchangeRate SMALLMONEY NULL,
    shippingMethodId INT NULL,
    shippingType VARCHAR(32) NULL,
    appointmentId VARCHAR(32) NULL,
    affiliateId VARCHAR(32) NULL,
    creditsStatus VARCHAR(32) NULL,
    creditsEarned SMALLMONEY NULL,
    creditsSpent SMALLMONEY NULL,
    cogsItems SMALLMONEY NULL,
    cogsPackaging SMALLMONEY NULL,
    cogsTotal SMALLMONEY NULL,
    createdAt DATETIME2 NULL,
    updatedAt DATETIME2 NULL,
    CONSTRAINT [pk_orders] PRIMARY KEY CLUSTERED (id ASC)
)
GO
CREATE NONCLUSTERED INDEX ix_orders_idx ON zte.orders (createdAt ASC, country ASC, status ASC)
GO

CREATE TABLE zte.orderItems
(
    id INT IDENTITY(1,1),
    itemId INT NULL,
    orderId VARCHAR(32) NULL,
    name VARCHAR(128) NULL,
    type VARCHAR(32) NULL,
    status VARCHAR(16) NULL,
    country VARCHAR(2) NULL,
    exchangeRate SMALLMONEY NULL,
    productId VARCHAR(16) NULL,
    variantId VARCHAR(32) NULL,
    price SMALLMONEY NULL,
    salePrice SMALLMONEY NULL,
    discountTotal SMALLMONEY NULL,
    size INT NULL,
    creditsStatus VARCHAR(32) NULL,
    creditsEarned SMALLMONEY NULL,
    cogsItems SMALLMONEY NULL,
    cogsPackaging SMALLMONEY NULL,
    cogsTotal SMALLMONEY NULL,
    CONSTRAINT [pk_orderItems] PRIMARY KEY CLUSTERED (id ASC)
)
GO
CREATE NONCLUSTERED INDEX ix_orderItems_idx ON zte.orderItems (type ASC, country ASC, productId ASC)
GO
ALTER TABLE zte.orderItems    
ADD CONSTRAINT fk_orders_orderItems FOREIGN KEY (orderId)     
    REFERENCES zte.orders (id)     
    ON DELETE CASCADE    
    ON UPDATE CASCADE  
GO

CREATE TABLE zte.users
(
    id VARCHAR(32),
    firstName VARCHAR(64) NULL,
    lastName VARCHAR(64) NULL,
    email VARCHAR(64) NULL,
    createdAt DATETIME2 NULL,
    mobileRegisteredAt DATETIME2 NULL,
    dob VARCHAR(64) NULL,
    gender VARCHAR(32) NULL,
    country VARCHAR(32) NULL,
    status VARCHAR(32) NULL,
    phone VARCHAR(64) NULL,
    roles VARCHAR(128) NULL,
    notifications VARCHAR(128) NULL,
    identityId VARCHAR(64) NULL,
    identityName VARCHAR(64) NULL,
    affiliateId VARCHAR(64) NULL,
    CONSTRAINT [pk_users] PRIMARY KEY CLUSTERED (id ASC)
)
GO
CREATE NONCLUSTERED INDEX ix_users_idx ON zte.users (createdAt ASC, status ASC, country ASC, gender ASC, phone ASC, email ASC)
GO

CREATE TABLE zte.products
(
    id VARCHAR(32),
    name VARCHAR(256) NULL,
    type VARCHAR(32) NULL,
    price SMALLMONEY NULL,
    CONSTRAINT [pk_products] PRIMARY KEY CLUSTERED (id ASC)
)
GO
CREATE NONCLUSTERED INDEX ix_products_idx ON zte.products (type ASC)
GO

CREATE TABLE zte.credits
(
    id VARCHAR(32),
    type VARCHAR(32) NULL,
    status VARCHAR(32) NULL,
    userId VARCHAR(32) NULL,
    orderId VARCHAR(32) NULL,
    balance SMALLMONEY NULL,
    amount SMALLMONEY NULL,
    spent SMALLMONEY NULL,
    country VARCHAR(2) NULL,
    exchangeRate SMALLMONEY NULL,
    createdAt DATETIME2 NULL,
    CONSTRAINT [pk_credits] PRIMARY KEY CLUSTERED (id ASC)
)
GO
CREATE NONCLUSTERED INDEX ix_credits_idx ON zte.credits (type ASC, status ASC, userId ASC, createdAt ASC)
GO

CREATE TABLE zte.creditTransactions
(
    id INT IDENTITY(1,1),
    creditId VARCHAR(32) NULL,
    orderId VARCHAR(32) NULL,
    createdAt DATETIME2 NULL,
    credit SMALLMONEY NULL,
    debit SMALLMONEY NULL,
    expired SMALLMONEY NULL,
    expiresOn DATETIME2 NULL,
    hasExpired BIT NULL,
    type VARCHAR(32) NULL,
    CONSTRAINT [pk_creditTransactions] PRIMARY KEY CLUSTERED (id ASC)
)
GO
CREATE NONCLUSTERED INDEX ix_creditTransactions_idx ON zte.creditTransactions (type ASC, expiresOn ASC, createdAt ASC)
GO
ALTER TABLE zte.creditTransactions    
ADD CONSTRAINT fk_credits_transactions FOREIGN KEY (creditId)     
    REFERENCES zte.credits (id)     
    ON DELETE CASCADE    
    ON UPDATE CASCADE  
GO
-- ALTER TABLE [zte].[orderItems] ADD CONSTRAINT fk_orderItems_orderId FOREIGN KEY (orderId)     
-- REFERENCES [zte].[orders] (id)     
-- ON DELETE CASCADE    
-- ON UPDATE CASCADE  
-- GO

-- IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[zte].[orderItems]') AND type in (N'U'))
-- DROP TABLE [zte].[orderItems]
-- GO
-- IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[zte].[orders]') AND type in (N'U'))
-- DROP TABLE [zte].[orders]
-- GO
-- IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[zte].[users]') AND type in (N'U'))
-- DROP TABLE [zte].[users]
-- GO