using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace BeaconServSite.Models
{
    public class BeaconPing
    {
        public int BeaconPingID { get; set; }

        [JsonIgnore]
        public virtual Client Client { get; set; }
        public virtual Beacon Beacon { get; set; }

        public DateTime Date { get; set; }
        
        public Guid UUID { get; set; }
        public int Major { get; set; }
        public int Minor { get; set; }
        public int Proximity { get; set; }
        public bool Cleared { get; set; }
    }
}