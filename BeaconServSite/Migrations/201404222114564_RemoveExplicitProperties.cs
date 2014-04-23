namespace BeaconServSite.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RemoveExplicitProperties : DbMigration
    {
        public override void Up()
        {
            this.Sql(@"DELETE FROM BeaconPings");
            DropForeignKey("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" }, "dbo.Beacons");
            DropIndex("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" });
            /*RenameColumn(table: "dbo.BeaconPings", name: "UUID", newName: "Beacon_UUID");
            RenameColumn(table: "dbo.BeaconPings", name: "Major", newName: "Beacon_Major");
            RenameColumn(table: "dbo.BeaconPings", name: "Minor", newName: "Beacon_Minor");
            AlterColumn("dbo.BeaconPings", "Beacon_UUID", c => c.Guid());
            AlterColumn("dbo.BeaconPings", "Beacon_Major", c => c.Int());
            AlterColumn("dbo.BeaconPings", "Beacon_Minor", c => c.Int());*/
            DropColumn(table: "dbo.BeaconPings", name: "UUID");
            DropColumn(table: "dbo.BeaconPings", name: "Major");
            DropColumn(table: "dbo.BeaconPings", name: "Minor");
            AddColumn("dbo.BeaconPings", "Beacon_UUID", c => c.Guid());
            AddColumn("dbo.BeaconPings", "Beacon_Major", c => c.Int());
            AddColumn("dbo.BeaconPings", "Beacon_Minor", c => c.Int());
            CreateIndex("dbo.BeaconPings", new[] { "Beacon_UUID", "Beacon_Major", "Beacon_Minor" });
            AddForeignKey("dbo.BeaconPings", new[] { "Beacon_UUID", "Beacon_Major", "Beacon_Minor" }, "dbo.Beacons", new[] { "UUID", "Major", "Minor" });
        }
        
        public override void Down()
        {
            this.Sql(@"DELETE FROM BeaconPings");
            DropForeignKey("dbo.BeaconPings", new[] { "Beacon_UUID", "Beacon_Major", "Beacon_Minor" }, "dbo.Beacons");
            DropIndex("dbo.BeaconPings", new[] { "Beacon_UUID", "Beacon_Major", "Beacon_Minor" });
            /*AlterColumn("dbo.BeaconPings", "Beacon_Minor", c => c.Int(nullable: false));
            AlterColumn("dbo.BeaconPings", "Beacon_Major", c => c.Int(nullable: false));
            AlterColumn("dbo.BeaconPings", "Beacon_UUID", c => c.Guid(nullable: false));
            RenameColumn(table: "dbo.BeaconPings", name: "Beacon_Minor", newName: "Minor");
            RenameColumn(table: "dbo.BeaconPings", name: "Beacon_Major", newName: "Major");
            RenameColumn(table: "dbo.BeaconPings", name: "Beacon_UUID", newName: "UUID");*/
            DropColumn(table: "dbo.BeaconPings", name: "Beacon_UUID");
            DropColumn(table: "dbo.BeaconPings", name: "Beacon_Major");
            DropColumn(table: "dbo.BeaconPings", name: "Beacon_Minor");
            AddColumn("dbo.BeaconPings", "UUID", c => c.Guid(nullable: false));
            AddColumn("dbo.BeaconPings", "Major", c => c.Int(nullable: false));
            AddColumn("dbo.BeaconPings", "Minor", c => c.Int(nullable: false));
            CreateIndex("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" });
            AddForeignKey("dbo.BeaconPings", new[] { "UUID", "Major", "Minor" }, "dbo.Beacons", new[] { "UUID", "Major", "Minor" }, cascadeDelete: true);
        }
    }
}
