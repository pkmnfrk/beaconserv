using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BeaconServSite.Models
{
    public class BeaconPing
    {
        public int BeaconPingID { get; set; }
        public virtual Client Client { get; set; }

        public DateTime Date { get; set; }
        public Guid UUID { get; set; }
        public int Major { get; set; }
        public int Minor { get; set; }
    }
}