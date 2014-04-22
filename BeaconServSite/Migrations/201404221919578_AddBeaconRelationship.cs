namespace BeaconServSite.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddBeaconRelationship : DbMigration
    {
        public override void Up()
        {
            this.Sql(@"DELETE FROM BeaconPings");
            CreateIndex("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" });
            AddForeignKey("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" }, "dbo.Beacons", new[] { "UUID", "Major", "Minor" }, cascadeDelete: true);
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" }, "dbo.Beacons");
            DropIndex("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" });
        }
    }
}
