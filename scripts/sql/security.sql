USE Master
GO
CREATE LOGIN [replication] WITH PASSWORD=N'76NUpbSgb&ac'
GO
USE Zesttee
GO
CREATE USER [replication] FOR LOGIN [replication]
GO
ALTER USER [replication] WITH DEFAULT_SCHEMA=[zte]
GO
sys.sp_addrolemember @rolename = N'db_owner', @membername = N'replication'


ALTER USER [Zesttee].[replication] WITH DEFAULT_SCHEMA = [Zesttee].[zte];
GO