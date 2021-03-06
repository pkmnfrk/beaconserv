﻿using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace BeaconServSite.Models
{
    public class Context : DbContext
    {
        public DbSet<Client> Clients { get; set; }
        public DbSet<Beacon> Beacons { get; set; }
        public DbSet<BeaconPing> BeaconPings { get; set; }

        public Context() : base("DefaultConnection") {
            this.Database.Log = s => System.Diagnostics.Debug.WriteLine(s);
        }
    }
}