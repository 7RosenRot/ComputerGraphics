using OpenTK;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using OpenTK.Graphics.OpenGL;
using System.IO;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.Button;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace Laboratory_Work_3
{
    public partial class Form1 : Form
    {
        public OpenTK.Vector3 CubeColor;
        public OpenTK.Vector3 CameraPosition;
        public OpenTK.Vector3 TetrahedronColor;

        public float Depth;
        public float ReflectionCube;
        public float ReflectionTetrahedron;

        public Form1() { InitializeComponent(); }

        private void glControl1_Load(object sender, EventArgs e) {
            View.Init();
            View.InitShaders();
        }

        private void glControl1_Paint(object sender, PaintEventArgs e) { Draw(); }

        private void glControl1_Resize(object sender, EventArgs e) {
            GL.Viewport(0, 0, glControl1.Width, glControl1.Height);
            glControl1.Invalidate();
        }

        private void SetUniformVec3(string name, OpenTK.Vector3 value) { GL.Uniform3(GL.GetUniformLocation(View.BasicProgramID, name), value); }

        private void SetUniform1f(string name, float value) { GL.Uniform1(GL.GetUniformLocation(View.BasicProgramID, name), value); }

        private void Draw() {
            GL.ClearColor(Color.White);
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);

            GL.UseProgram(View.BasicProgramID);

            SetUniformVec3("cube_color", CubeColor);
            SetUniformVec3("camera_position", CameraPosition);
            SetUniformVec3("tetrahedron_color", TetrahedronColor);

            SetUniform1f("set_depth", Depth);
            SetUniform1f("set_reflection_cube", ReflectionCube);
            SetUniform1f("set_reflection_tetrahedron", ReflectionTetrahedron);

            GL.Color3(Color.White);
            GL.Begin(PrimitiveType.Quads);

            GL.TexCoord2(0, 1);
            GL.Vertex2(-1, -1);

            GL.TexCoord2(1, 1);
            GL.Vertex2(1, -1);

            GL.TexCoord2(1, 0);
            GL.Vertex2(1, 1);

            GL.TexCoord2(0, 0);
            GL.Vertex2(-1, 1);

            GL.End();

            glControl1.SwapBuffers();
            GL.UseProgram(0);
        }

        private void trackBar1_Scroll(object sender, EventArgs e) {
            CubeColor.X = trackBar1.Value / 255.0f;
            glControl1.Invalidate();
        }

        private void trackBar2_Scroll(object sender, EventArgs e) {
            CubeColor.Y = trackBar2.Value / 255.0f;
            glControl1.Invalidate();
        }

        private void trackBar3_Scroll(object sender, EventArgs e) {
            CubeColor.Z = trackBar3.Value / 255.0f;
            glControl1.Invalidate();
        }

        private void trackBar4_Scroll(object sender, EventArgs e) {
            CameraPosition.X = trackBar4.Value;
            glControl1.Invalidate();
        }

        private void trackBar5_Scroll(object sender, EventArgs e) {
            CameraPosition.Y = trackBar5.Value;
            glControl1.Invalidate();
        }

        private void trackBar6_Scroll(object sender, EventArgs e) {
            CameraPosition.Z = trackBar6.Value;
            glControl1.Invalidate();
        }

        private void trackBar7_Scroll(object sender, EventArgs e) {
            Depth = trackBar7.Value;
            glControl1.Invalidate();
        }

        private void checkBox1_CheckedChanged(object sender, EventArgs e) {
            if (checkBox1.Checked) {
                ReflectionCube = 1;
                glControl1.Invalidate();
            } 
            else {
                ReflectionCube = 0;
                glControl1.Invalidate();
            }
        }
    }
}