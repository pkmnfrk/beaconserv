namespace BeaconServSite.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddPing : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.BeaconPings",
                c => new
                    {
                        BeaconPingID = c.Int(nullable: false, identity: true),
                        Date = c.DateTime(nullable: false),
                        UUID = c.Guid(nullable: false),
                        Major = c.Int(nullable: false),
                        Minor = c.Int(nullable: false),
                        Client_ClientID = c.Guid(),
                    })
                .PrimaryKey(t => t.BeaconPingID)
                .ForeignKey("dbo.Clients", t => t.Client_ClientID)
                .Index(t => t.Client_ClientID);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.BeaconPings", "Client_ClientID", "dbo.Clients");
            DropIndex("dbo.BeaconPings", new[] { "Client_ClientID" });
            DropTable("dbo.BeaconPings");
        }
    }
}
