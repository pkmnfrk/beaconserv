using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BeaconServSite.Models
{
    public class BeaconEvent
    {
        public DateTime Date { get; set; }

        public Client Client { get; set; }
        public Beacon Beacon { get; set; }

    }
}