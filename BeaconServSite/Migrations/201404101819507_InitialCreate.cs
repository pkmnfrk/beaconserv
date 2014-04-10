namespace BeaconServSite.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class InitialCreate : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Beacons",
                c => new
                    {
                        BeaconID = c.Int(nullable: false, identity: true),
                        UUID = c.Guid(),
                        Major = c.Int(),
                        Minor = c.Int(),
                        BodyText = c.String(maxLength: 4000),
                        Title = c.String(maxLength: 4000),
                        Url = c.String(maxLength: 4000),
                        Image = c.String(maxLength: 4000),
                        Video = c.String(maxLength: 4000),
                        MaxProximity = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.BeaconID);
            
            CreateTable(
                "dbo.Clients",
                c => new
                    {
                        ClientID = c.Guid(nullable: false),
                    })
                .PrimaryKey(t => t.ClientID);
            
        }
        
        public override void Down()
        {
            DropTable("dbo.Clients");
            DropTable("dbo.Beacons");
        }
    }
}
