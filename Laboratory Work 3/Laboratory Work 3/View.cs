using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Threading.Tasks;
using OpenTK;
using OpenTK.Graphics.OpenGL;

namespace Laboratory_Work_3
{
    internal class View : Form1
    {
        public static int BasicProgramID;
        public static int BasicVertexShader;
        public static int BasicFragmentShader;

        public static bool Init() {
            GL.Enable(EnableCap.ColorMaterial);     //включает управление свойством материала с помощью текущего цвета
            GL.ShadeModel(ShadingModel.Smooth);     //включает сглаживание

            GL.Enable(EnableCap.DepthTest);         //включает тест глубины
            GL.Enable(EnableCap.CullFace);          //отключает все нелицевые грани

            GL.Enable(EnableCap.Lighting);          //включаем освещение
            GL.Enable(EnableCap.Light0);            //включает нулевой источник света

            GL.Hint(HintTarget.PerspectiveCorrectionHint, HintMode.Nicest);

            return true;
        }

        public static void loadShader(String filename, ShaderType type, int program, out int address) {
            address = GL.CreateShader(type);
            using (System.IO.StreamReader sr = new System.IO.StreamReader(filename)) { GL.ShaderSource(address, sr.ReadToEnd()); }
            GL.CompileShader(address);
            GL.AttachShader(program, address);
            Console.WriteLine(GL.GetShaderInfoLog(address));
        }

        public static void InitShaders() {
            int status = 0;

            BasicProgramID = GL.CreateProgram();
            loadShader("D:\\Microsoft Visual Studio\\Visual Studio 2022\\Others\\Computer Graphics\\Laboratory Work 3\\Laboratory Work 3\\Shaders\\raytracing.vert", ShaderType.VertexShader, BasicProgramID, out BasicVertexShader);
            loadShader("D:\\Microsoft Visual Studio\\Visual Studio 2022\\Others\\Computer Graphics\\Laboratory Work 3\\Laboratory Work 3\\Shaders\\raytracing.frag", ShaderType.FragmentShader, BasicProgramID, out BasicFragmentShader);
            GL.LinkProgram(BasicProgramID);
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);
            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
        }
    }
}