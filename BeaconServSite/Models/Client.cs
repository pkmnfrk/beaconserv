using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BeaconServSite.Models
{
    public class Client
    {
        public Guid ClientID { get; set; }
        public string Name { get; set; }

        public virtual List<BeaconPing> BeaconPings { get; set; }
    }
}