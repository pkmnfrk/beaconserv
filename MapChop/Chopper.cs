using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace MapChop
{
    class Chopper
    {
        public Size SourceSize { get; private set; }
        public Size DestSize { get; private set; }

        public Chopper(Size sourceSize, Size destSize)
        {
            SourceSize = sourceSize;
            DestSize = destSize;
        }

        public void Go(Image image, string destFolder)
        {
            Rectangle source = new Rectangle(Point.Empty, SourceSize);
            Rectangle dest = new Rectangle(Point.Empty, DestSize);
            Bitmap temp = new Bitmap(DestSize.Width, DestSize.Height, PixelFormat.Format32bppArgb);

            using (var g = Graphics.FromImage(temp))
            {
                var x = 0;
                while (source.X < image.Width)
                {
                    var xPath = Path.Combine(destFolder, x.ToString());
                    if (!Directory.Exists(xPath))
                    {
                       // try
                        //{
                            Directory.CreateDirectory(xPath);
                        //}
                        //catch { }
                    }

                    var y = 0;
                    while (source.Y < image.Height)
                    {
                        var yPath = Path.Combine(xPath, (y != 0 ? "" : "") + y.ToString() + ".png");
                        g.Clear(Color.Transparent);
                        g.DrawImage(image, dest, source, GraphicsUnit.Pixel);

                        //if (!IsEmpty(temp))
                        //{
                            temp.Save(yPath, System.Drawing.Imaging.ImageFormat.Png);
                        //}

                        source.Y += source.Height;
                        y++;
                    }
                    source.Y = 0;
                    source.X += source.Width;
                    x++;
                }
            }
        }

        private bool IsEmpty(Bitmap img)
        {
            var format = PixelFormat.Format24bppRgb;
            int pixelFormatSize = Image.GetPixelFormatSize(format) / 8;
            int stride = img.Width * pixelFormatSize;
            var bits = new int[stride * img.Height / sizeof(int)];
            var handle = GCHandle.Alloc(bits, GCHandleType.Pinned);
            try
            {
                var pointer = Marshal.UnsafeAddrOfPinnedArrayElement(bits, 0);

                var newBitmap = new Bitmap(img.Width, img.Height, stride, format, pointer);

                using (var g = Graphics.FromImage(newBitmap))
                {
                    g.Clear(Color.White);
                    g.DrawImage(img, Point.Empty);
                }

                for (int i = 0; i < bits.Length; i++)
                {
                    if (bits[i] != -1)
                        return false;
                }

                return true;
            }
            finally
            {
                bits = null;
                handle.Free();
            }
            
        }
    }
}
