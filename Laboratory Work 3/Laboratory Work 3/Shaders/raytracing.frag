#version 430

//#define EPSILON = 0.001
//#define BIG = 1000000.0

#define EPSILON 0.001

const int DIFFUSE = 1;	
const int REFLECTION = 2;			
const int REFRACTION = 3;		

const int DIFFUSE_REFLECTION = 1;	
const int MIRROR_REFLECTION = 2;	 

const int MAX_STACK_SIZE = 10;
const int MAX_TRACE_DEPTH = 8;

const vec3 Unit = vec3 ( 1.0, 1.0, 1.0 );
out vec4 FragColor;
in vec3 glPosition;

uniform vec3 camera_position;
uniform vec3 cube_color;
uniform vec3 tetrahedron_color;

uniform float set_reflection_cube;
uniform float set_reflection_tetrahedron;
uniform float set_depth;

struct SCamera {
    vec3 Position;
    vec3 View;
    vec3 Up;
    vec3 Side;
    vec2 Scale;		
}; 
 
struct SRay {
    vec3 Origin;		
	vec3 Direction;		
}; 
 
struct SSphere {    
    vec3 Center;
	float Radius;

	int MaterialIdx;	
}; 

struct STriangle {     
    vec3 v1;   
	vec3 v2;   
	vec3 v3;   

	int MaterialIdx;	
};

struct SMaterial {  
    vec3 Color;				

	vec4 LightCoeffs;			
	float ReflectionCoef;	
	float RefractionCoef;   

	int MaterialType;		
};

struct SCube {
	STriangle bounds[12];

	int MaterialIdx;		
};

struct STetrahedron {
	STriangle Tbounds[4];

	int MaterialIdx;
};

struct SIntersection {        
	float Time;

	vec3 Point;				
	vec3 Normal;			
	vec3 Color;				

	vec4 LightCoeffs;						
	float ReflectionCoef;	
	float RefractionCoef;   
	
	int MaterialType;		
};

struct SLight { vec3 Position; };

struct STracingRay { 
    SRay ray;				
	float contribution;		
	float depth;			
};

STriangle Triangles[12];	
SSphere Spheres[2];			
SMaterial Materials[9];		

SCube cube;
SLight uLight;				
SCamera uCamera;
STetrahedron tetrahedron;

SRay GenerateRay ( SCamera uCamera ) {  
    vec2 coords = glPosition.xy * uCamera.Scale;
	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;	
	
	return SRay ( uCamera.Position, normalize(direction) );
}

void initializeDefaultScene (out STriangle triangles[12], out SSphere spheres[2]) {	
    triangles[0].v1 = vec3(-5.0,-5.0,-8.0); 
	triangles[0].v2 = vec3(-5.0, 5.0, 5.0); 
	triangles[0].v3 = vec3(-5.0, 5.0,-8.0); 
	triangles[0].MaterialIdx = 0; 
 
    triangles[1].v1 = vec3(-5.0,-5.0,-8.0);
	triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
	triangles[1].v3 = vec3(-5.0, 5.0, 5.0); 
	triangles[1].MaterialIdx = 0;
	
	triangles[2].v1 = vec3(-5.0, 5.0, 5.0); 
	triangles[2].v2 = vec3(-5.0, -5.0, 5.0); 
	triangles[2].v3 = vec3(5.0, -5.0, 5.0); 
	triangles[2].MaterialIdx = 1; 
 
    triangles[3].v1 = vec3(5.0,-5.0, 5.0);
	triangles[3].v2 = vec3(5.0, 5.0, 5.0);
	triangles[3].v3 = vec3(-5.0, 5.0, 5.0); 
	triangles[3].MaterialIdx = 1;
	
	triangles[4].v1 = vec3(5.0, -5.0, 5.0); 
	triangles[4].v2 = vec3(5.0, 5.0, 5.0); 
	triangles[4].v3 = vec3(5.0, 5.0, -8.0); 
	triangles[4].MaterialIdx = 2; 
 
    triangles[5].v1 = vec3(5.0, 5.0,-8.0);
	triangles[5].v2 = vec3(5.0, -5.0, -8.0);
	triangles[5].v3 = vec3(5.0, -5.0, 5.0); 
	triangles[5].MaterialIdx = 2;
	
	triangles[6].v1 = vec3(-5.0, 5.0, 5.0); 
	triangles[6].v2 = vec3(-5.0, 5.0, -8.0); 
	triangles[6].v3 = vec3(5.0, 5.0, -8.0); 
	triangles[6].MaterialIdx = 3; 
 
    triangles[7].v1 = vec3(5.0, 5.0, -8.0); 
	triangles[7].v2 = vec3(5.0, 5.0, 5.0); 
	triangles[7].v3 = vec3(-5.0, 5.0, 5.0); 
	triangles[7].MaterialIdx = 3;
 
    triangles[8].v1 = vec3(-5.0, -5.0, 5.0);
	triangles[8].v2 = vec3(-5.0, -5.0, -8.0);
	triangles[8].v3 = vec3(5.0, -5.0, -8.0); 
	triangles[8].MaterialIdx = 4;
	
	triangles[9].v1 = vec3(5.0,-5.0,-8.0);
	triangles[9].v2 = vec3(5.0, -5.0, 5.0);
	triangles[9].v3 = vec3(-5.0, -5.0, 5.0); 
	triangles[9].MaterialIdx = 4;
	
	triangles[10].v1 = vec3(-5.0, -5.0, -8.0);
	triangles[10].v2 = vec3(5.0, -5.0, -8.0);
	triangles[10].v3 = vec3(5.0, 5.0, -8.0); 
	triangles[10].MaterialIdx = 5;
	
	triangles[11].v1 = vec3(5.0, 5.0,-8.0);
	triangles[11].v2 = vec3(-5.0, 5.0, -8.0);
	triangles[11].v3 = vec3(-5.0, -5.0, -8.0); 
	triangles[11].MaterialIdx = 5;
	
	
	spheres[0].Center = vec3(2.0,0.0,2.0);  
	spheres[0].Radius = 0.3;  
	spheres[0].MaterialIdx = 6; 
 
    spheres[1].Center = vec3(-1.5,1.0,1.0);  
	spheres[1].Radius = 1.3;  
	spheres[1].MaterialIdx = 6;

	
	cube.bounds[0].v1 = vec3(1.0,1.0,2.0);
	cube.bounds[0].v2 = vec3(1.0,1.5,2.0);
	cube.bounds[0].v3 = vec3(1.0,1.0,1.5);
	cube.bounds[0].MaterialIdx = 7;
	
	cube.bounds[1].v1 = vec3(1.0,1.5,1.5);
	cube.bounds[1].v2 = vec3(1.0,1.5,2.0);
	cube.bounds[1].v3 = vec3(1.0,1.0,1.5);
	cube.bounds[1].MaterialIdx = 7;

	cube.bounds[2].v1 = vec3(1.0,1.0,2.0);
	cube.bounds[2].v2 = vec3(1.0,1.5,2.0);
	cube.bounds[2].v3 = vec3(1.5,1.0,2.0);
	cube.bounds[2].MaterialIdx = 7;
	
	cube.bounds[3].v1 = vec3(1.5,1.5,2.0);
	cube.bounds[3].v2 = vec3(1.0,1.5,2.0);
	cube.bounds[3].v3 = vec3(1.5,1.0,2.0);
	cube.bounds[3].MaterialIdx = 7;
	
	cube.bounds[4].v1 = vec3(1.5,1.5,1.5);
	cube.bounds[4].v2 = vec3(1.0,1.5,1.5);
	cube.bounds[4].v3 = vec3(1.0,1.5,2.0);
	cube.bounds[4].MaterialIdx = 7;
	
	cube.bounds[5].v1 = vec3(1.5,1.5,1.5);
	cube.bounds[5].v2 = vec3(1.5,1.5,2.0);
	cube.bounds[5].v3 = vec3(1.0,1.5,2.0);
	cube.bounds[5].MaterialIdx = 7;
	
	cube.bounds[6].v1 = vec3(1.5,1.5,1.5);
	cube.bounds[6].v2 = vec3(1.5,1.5,2.0);
	cube.bounds[6].v3 = vec3(1.5,1.0,1.5);
	cube.bounds[6].MaterialIdx = 7;
	
	cube.bounds[7].v1 = vec3(1.5,1.0,2.0);
	cube.bounds[7].v2 = vec3(1.5,1.5,2.0);
	cube.bounds[7].v3 = vec3(1.5,1.0,1.5);
	cube.bounds[7].MaterialIdx = 7;
	
	cube.bounds[8].v1 = vec3(1.0,1.0,2.0);
	cube.bounds[8].v2 = vec3(1.0,1.0,1.5);
	cube.bounds[8].v3 = vec3(1.5,1.0,1.5);
	cube.bounds[8].MaterialIdx = 7;

	cube.bounds[9].v1 = vec3(1.0,1.0,2.0);
	cube.bounds[9].v2 = vec3(1.5,1.0,2.0);
	cube.bounds[9].v3 = vec3(1.5,1.0,1.5);
	cube.bounds[9].MaterialIdx = 7;
	
	cube.bounds[10].v1 = vec3(1.0,1.5,1.5);
	cube.bounds[10].v2 = vec3(1.5,1.5,1.5);
	cube.bounds[10].v3 = vec3(1.0,1.0,1.5);
	cube.bounds[10].MaterialIdx = 7;
	
	cube.bounds[11].v1 = vec3(1.5,1.0,1.5);
	cube.bounds[11].v2 = vec3(1.5,1.5,1.5);
	cube.bounds[11].v3 = vec3(1.0,1.0,1.5);
	cube.bounds[11].MaterialIdx = 7;
	cube.MaterialIdx = 7;

	
	tetrahedron.Tbounds[0].v1 = vec3(1.0,-2.0,3.0);		
	tetrahedron.Tbounds[0].v2 = vec3(1.0,-3.5,3.0);		
	tetrahedron.Tbounds[0].v3 = vec3(3.5,-2.0,3.0);		
	tetrahedron.Tbounds[0].MaterialIdx = 8;

	tetrahedron.Tbounds[1].v1 = vec3(1.5,-2.5,2.5);		
	tetrahedron.Tbounds[1].v2 = vec3(1.0,-2.0,3.0);		
	tetrahedron.Tbounds[1].v3 = vec3(3.5,-2.0,3.0);		
	tetrahedron.Tbounds[1].MaterialIdx = 8;
	
	tetrahedron.Tbounds[2].v1 = vec3(1.5,-2.5,2.5);		
	tetrahedron.Tbounds[2].v2 = vec3(1.0,-3.5,3.0);		
	tetrahedron.Tbounds[2].v3 = vec3(3.5,-2.0,3.0);		
	tetrahedron.Tbounds[2].MaterialIdx = 8;

	tetrahedron.Tbounds[3].v1 = vec3(1.5,-2.5,2.5);		
	tetrahedron.Tbounds[3].v2 = vec3(1.0,-2.0,3.0);		
	tetrahedron.Tbounds[3].v3 = vec3(1.0,-3.5,3.0);		
	tetrahedron.Tbounds[3].MaterialIdx = 8;
	
	tetrahedron.MaterialIdx = 8;
}

void initializeDefaultLightMaterials(out SLight light, out SMaterial materials[9]) {
    light.Position = vec3(0.0, 3.0, -4.0f);				
 
    vec4 lightCoefs = vec4(0.4,0.9,0.25,10.0);			
														
	materials[0].Color = vec3(0.0, 1.0, 0.0);			
	materials[0].LightCoeffs = vec4(lightCoefs);
	materials[0].ReflectionCoef = 0.5;   
	materials[0].RefractionCoef = 1.0;  
	materials[0].MaterialType = DIFFUSE_REFLECTION;		
 
    materials[1].Color = vec3(0.1, 0.1, 0.1);			
	materials[1].LightCoeffs = vec4(lightCoefs); 
    materials[1].ReflectionCoef = 0.5;  
	materials[1].RefractionCoef = 1.0;  
	materials[1].MaterialType = DIFFUSE_REFLECTION;
	
	materials[2].Color = vec3(1.0, 0.0, 0.0);			
	materials[2].LightCoeffs = vec4(lightCoefs); 
    materials[2].ReflectionCoef = 0.5;  
	materials[2].RefractionCoef = 1.0;  
	materials[2].MaterialType = DIFFUSE_REFLECTION;		
	
	materials[3].Color = vec3(1.0, 1.0, 0.0);			
	materials[3].LightCoeffs = vec4(lightCoefs); 
    materials[3].ReflectionCoef = 0.5;  
	materials[3].RefractionCoef = 1.0;  
	materials[3].MaterialType = MIRROR_REFLECTION;
	
	materials[4].Color = vec3(0.0, 1.0, 1.0);			
	materials[4].LightCoeffs = vec4(lightCoefs); 
    materials[4].ReflectionCoef = 0.5;  
	materials[4].RefractionCoef = 1.0;  
	materials[4].MaterialType = DIFFUSE_REFLECTION;
	
	materials[5].Color = vec3(0.0, 0.0, 1.0);			
	materials[5].LightCoeffs = vec4(lightCoefs); 
    materials[5].ReflectionCoef = 0.5;  
	materials[5].RefractionCoef = 1.0;  
	materials[5].MaterialType = DIFFUSE_REFLECTION;
	
	materials[6].Color = vec3(1.0, 1.0, 1.0);			
	materials[6].LightCoeffs = vec4(lightCoefs); 
    materials[6].ReflectionCoef = 0.5;  
	materials[6].RefractionCoef = 1.0;  
	materials[6].MaterialType = MIRROR_REFLECTION;

	if (set_reflection_cube == 1) {
		materials[7].Color = cube_color;					
		materials[7].LightCoeffs = vec4(lightCoefs);  
		materials[7].ReflectionCoef = 0.5;  
		materials[7].RefractionCoef = 1.0;  
		materials[7].MaterialType = MIRROR_REFLECTION;
	}
	else {
		materials[7].Color = cube_color;					
		materials[7].LightCoeffs = vec4(lightCoefs);  
		materials[7].ReflectionCoef = 0.5;  
		materials[7].RefractionCoef = 1.0;  
		materials[7].MaterialType = DIFFUSE_REFLECTION;
	}
				
	materials[8].Color = vec3(0.2, 0.2, 0.2);				
	materials[8].LightCoeffs = vec4(lightCoefs); 
	materials[8].ReflectionCoef = 0.0;  
	materials[8].RefractionCoef = 1.3;  
	materials[8].MaterialType = REFRACTION;
}

bool IntersectSphere ( SSphere sphere, SRay ray, float start, float final, out float time )	{     
    ray.Origin -= sphere.Center;													
	
	float A = dot ( ray.Direction, ray.Direction );									
	float B = dot ( ray.Direction, ray.Origin );   
	float C = dot ( ray.Origin, ray.Origin ) - sphere.Radius * sphere.Radius;		
	float D = B * B - A * C;														

    if ( D > 0.0 ) {
    	D = sqrt ( D );

		float t1 = ( -B - D ) / A;   
		float t2 = ( -B + D ) / A;      

		if(t1 < 0 && t2 < 0) { return false; } 
		
        if(min(t1, t2) < 0) {            
    		time = max(t1,t2);      
			return true;      
		}  

		time = min(t1, t2);    

		return true;  
	}  
	return false; 
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time ) {
    time = -1; 

	vec3 A = v2 - v1;										
	vec3 B = v3 - v1; 	
	vec3 N = cross(A, B);									

	float NdotRayDirection = dot(N, ray.Direction);			

	if (abs(NdotRayDirection) < 0.001) { return false; }
												
	float d = dot(N, v1);
	float t = -(dot(N, ray.Origin) - d) / NdotRayDirection; 

	if (t < 0) { return false; }
															
	vec3 P = ray.Origin + t * ray.Direction;				
	vec3 C;
	
	vec3 edge1 = v2 - v1;									
	vec3 VP1 = P - v1; 

	C = cross(edge1, VP1); 

	if (dot(N, C) < 0) { return false; }

	vec3 edge2 = v3 - v2;									
	vec3 VP2 = P - v2; 

	C = cross(edge2, VP2); 

	if (dot(N, C) < 0) { return false; }

	vec3 edge3 = v1 - v3;									
	vec3 VP3 = P - v3; 

	C = cross(edge3, VP3); 

	if (dot(N, C) < 0) { return false; }

	time = t; 

	return true;											
}


bool Raytrace (SRay ray, float start, float final, inout SIntersection intersect) {
    bool result = false; 
	float test = start; 
	intersect.Time = final; 
	
	for(int i = 0; i < 12; i++) {
	    STriangle triangle = Triangles[i]; 

	    if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time) {        
    	    intersect.Time = test;  
			
			intersect.Point = ray.Origin + ray.Direction * test;  
			intersect.Normal = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			
			SMaterial mat = Materials[i / 2];
			
			intersect.Color = mat.Color;    
			
			intersect.LightCoeffs = mat.LightCoeffs;
			intersect.ReflectionCoef = mat.ReflectionCoef;       
			intersect.RefractionCoef = mat.RefractionCoef;       
			
			intersect.MaterialType = mat.MaterialType;       
			
			result = true;   
		} 
	}
	
	for(int i = 0; i < 2; i++) {
	    SSphere sphere = Spheres[i];

		if( IntersectSphere (sphere, ray, start, final, test ) && test < intersect.Time ) {       
    		intersect.Time = test;    
			
			intersect.Point = ray.Origin + ray.Direction * test;      
			intersect.Normal = normalize ( intersect.Point - sphere.Center );
			
			SMaterial mat = Materials[6];
			
			intersect.Color = mat.Color;        
			
			intersect.LightCoeffs = mat.LightCoeffs;
			intersect.ReflectionCoef = mat.ReflectionCoef;   
			intersect.RefractionCoef = mat.RefractionCoef;       
			
			intersect.MaterialType =   mat.MaterialType;  
			
			result = true;    
	    } 
	}

	for(int i = 0; i < 12; i++) {
	    STriangle triangle = cube.bounds[i]; 

	    if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time) {        
    	    intersect.Time = test;  
			
			intersect.Point = ray.Origin + ray.Direction * test;  
			intersect.Normal = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			
			SMaterial mat = Materials[7];
			
			intersect.Color = cube_color;
			
			intersect.LightCoeffs = mat.LightCoeffs;
			intersect.ReflectionCoef = mat.ReflectionCoef;       
			intersect.RefractionCoef = mat.RefractionCoef;       
			
			intersect.MaterialType = mat.MaterialType;       
			
			result = true;   
		} 
	}

	for(int i = 0; i < 4; i++) {
	    STriangle triangle = tetrahedron.Tbounds[i]; 

	    if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time) {        
    	    intersect.Time = test;  
			
			intersect.Point = ray.Origin + ray.Direction * test;  
			intersect.Normal = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			
			SMaterial mat = Materials[8];
			
			intersect.Color = mat.Color; 
			
			intersect.LightCoeffs = mat.LightCoeffs;
			intersect.ReflectionCoef = mat.ReflectionCoef;       
			intersect.RefractionCoef = mat.RefractionCoef;       
			
			intersect.MaterialType = mat.MaterialType;       
			
			result = true;   
		} 
	}
	return result;
} 

vec3 Phong ( SIntersection intersect, SLight currLight, float shadowing) {
    vec3 light = normalize ( currLight.Position - intersect.Point ); 
    
	float diffuse = max(dot(light, intersect.Normal), 0.0);   
	
	vec3 view = normalize(uCamera.Position - intersect.Point);  
	vec3 reflected= reflect( -view, intersect.Normal );   
	
	float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);    
	
	return intersect.LightCoeffs.x * intersect.Color + 
	       intersect.LightCoeffs.y * diffuse * intersect.Color * shadowing + 
		   intersect.LightCoeffs.z * specular * Unit;
} 

float Shadow(SLight currLight, SIntersection intersect)	{     
    float shadowing = 1.0;  

	vec3 direction = normalize(currLight.Position - intersect.Point);			
	float distanceLight = distance(currLight.Position, intersect.Point);		
	
	SRay shadowRay = SRay(intersect.Point + direction * 0.001, direction);		
	
	SIntersection shadowIntersect;     
	shadowIntersect.Time = 1000000.0;      
	
	if(Raytrace(shadowRay, 0, distanceLight, shadowIntersect)) { shadowing = 0.0; }

	return shadowing; 
}

STracingRay stack[MAX_STACK_SIZE];
int stackSize = 0;

bool pushRay(STracingRay secondaryRay) {
	if(stackSize < MAX_STACK_SIZE - 1 && secondaryRay.depth < MAX_TRACE_DEPTH) {
		stack[stackSize] = secondaryRay;
		stackSize++;
		return true;
	}
	return false;
}

STracingRay popRay() {
	stackSize--;
	return stack[stackSize];	
}

bool isEmpty() {
	if(stackSize < 0)
		return true;
	return false;
}


void main (void) {
    float start = 0;   
	float final = 1000000.0;
	
	uCamera.Position = camera_position;
    uCamera.View = vec3(0.0, 0.0, 1.0); 
	uCamera.Up = vec3(0.0, 1.0, 0.0);  
	uCamera.Side = vec3(1.0, 0.0, 0.0); 
	uCamera.Scale = vec2(1.0); 

	SRay ray = GenerateRay(uCamera);
	SIntersection intersect;        

	intersect.Time = 1000000.0;    
	vec3 resultColor = vec3(0,0,0);

	initializeDefaultLightMaterials(uLight, Materials);
    initializeDefaultScene(Triangles, Spheres);	

	STracingRay trRay = STracingRay(ray, 1, set_depth); 
	pushRay(trRay); 

	while(!isEmpty()) {
	    STracingRay trRay = popRay();     
		ray = trRay.ray;    
		
		SIntersection intersect;  
		intersect.Time = 1000000.0;   
		
		start = 0;     
		final = 1000000.0;    
		
		if (Raytrace(ray, start, final, intersect)) {
    		switch(intersect.MaterialType){
    			case DIFFUSE_REFLECTION: {
    				float shadowing = Shadow(uLight, intersect);   
					
					resultColor += trRay.contribution * Phong ( intersect, uLight, shadowing );   
					
					break;       
				}  
				case MIRROR_REFLECTION: { 
    				if(intersect.ReflectionCoef < 1) {
					    float contribution = trRay.contribution * (1 - intersect.ReflectionCoef);     
					    float shadowing = Shadow(uLight, intersect);              
					    
						resultColor +=  contribution * Phong(intersect, uLight, shadowing);    
				    }  
				    vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
				    
					float contribution = trRay.contribution * intersect.ReflectionCoef;  
				    
					STracingRay reflectRay = STracingRay( SRay(intersect.Point + reflectDirection * 0.001, reflectDirection), 
														  contribution, trRay.depth + 1);    
				    pushRay(reflectRay);  
				    
					break;  
			    }     
				case REFRACTION: {
					float diffuse_contrib = trRay.contribution; 
					float shadowing = Shadow(uLight, intersect);
					
					resultColor += diffuse_contrib * Phong(intersect, uLight, shadowing);
					
					if (trRay.depth >= MAX_TRACE_DEPTH) { break; }
					
					float eta = 1.0f / 1.5f;				
															
					if (dot(ray.Direction, intersect.Normal) >= 0.0f) {
						intersect.Normal = -intersect.Normal;
						eta = intersect.RefractionCoef / 1.0f;
					}
					
					float refract_contrib = trRay.contribution * intersect.RefractionCoef;		
					if (refract_contrib > 0.001) {
						vec3 refractDirection = refract(ray.Direction, intersect.Normal, eta);	
					
						STracingRay refractRay = STracingRay(SRay(intersect.Point + refractDirection * 0.001, refractDirection), 
																refract_contrib, trRay.depth + 1);	
						pushRay(refractRay);
					}
					break;
				}
			}  
		}
	}
    FragColor = vec4(resultColor, 1.0);
}