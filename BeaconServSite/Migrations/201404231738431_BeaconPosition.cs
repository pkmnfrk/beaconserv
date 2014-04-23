namespace BeaconServSite.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class BeaconPosition : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Beacons", "Latitude", c => c.Double(nullable: false));
            AddColumn("dbo.Beacons", "Longitude", c => c.Double(nullable: false));
        }
        
        public override void Down()
        {
            DropColumn("dbo.Beacons", "Longitude");
            DropColumn("dbo.Beacons", "Latitude");
        }
    }
}
