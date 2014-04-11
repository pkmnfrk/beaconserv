namespace BeaconServSite.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RemoveBeaconID : DbMigration
    {
        public override void Up()
        {
            DropPrimaryKey("dbo.Beacons");
            AddColumn("dbo.BeaconPings", "Proximity", c => c.Int(nullable: false));
            AddColumn("dbo.BeaconPings", "Cleared", c => c.Boolean(nullable: false));
            AlterColumn("dbo.Beacons", "UUID", c => c.Guid(nullable: false));
            AlterColumn("dbo.Beacons", "Major", c => c.Int(nullable: false));
            AlterColumn("dbo.Beacons", "Minor", c => c.Int(nullable: false));
            AddPrimaryKey("dbo.Beacons", new[] { "UUID", "Major", "Minor" });
            DropColumn("dbo.Beacons", "BeaconID");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Beacons", "BeaconID", c => c.Int(nullable: false, identity: true));
            DropPrimaryKey("dbo.Beacons");
            AlterColumn("dbo.Beacons", "Minor", c => c.Int());
            AlterColumn("dbo.Beacons", "Major", c => c.Int());
            AlterColumn("dbo.Beacons", "UUID", c => c.Guid());
            DropColumn("dbo.BeaconPings", "Cleared");
            DropColumn("dbo.BeaconPings", "Proximity");
            AddPrimaryKey("dbo.Beacons", "BeaconID");
        }
    }
}
