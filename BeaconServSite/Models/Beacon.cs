using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using BeaconServSite.Code;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeaconServSite.Models
{
    public class Beacon
    {
        [Key, Column(Order=1)]
        public Guid UUID { get; set; }
        [Key, Column(Order = 2)]
        public int Major { get; set; }
        [Key, Column(Order = 3)]
        public int Minor { get; set; }

        public string BodyText { get; set; }
        public string Title { get; set; }
        public string Url { get; set; }
        public string Image { get; set; }
        public string Video { get; set; }

        public int MaxProximity { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public Beacon()
        {

        }
    }
}
