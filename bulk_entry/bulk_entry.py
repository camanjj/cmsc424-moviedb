import os, platform, time, json, uuid, requests, datetime
from tkinter import *
from tkinter.filedialog import askopenfilenames
from tkinter.messagebox import showerror
from requests.exceptions import ConnectionError

class popupWindow(object):
	def __init__(self, parent, file_info):
		top = self.top = Toplevel(parent, height=200, width=100)
		self.parent = parent
		self.file_data = json.loads(file_info)
		self.check = IntVar()

		default = StringVar(top,value=self.file_data['file_name'])

		w = self.top.winfo_screenwidth()
		h = self.top.winfo_screenheight()
		size = (200,100)
		x = w/2 - size[0]/2
		y = h/2 - size[1]/2
		self.top.geometry("%dx%d+%d+%d" % (size + (x, y)))

		self.l = Label(top,text="Rename DAGR")
		self.l.pack()

		self.e = Entry(top, textvariable=default)
		self.e.pack()

		self.b = Button(top,text='Confirm',command=self.cleanup)
		self.b.pack()

		self.skip_b = Checkbutton(top, text="Skip naming remaining", pady="2", variable=self.check, onvalue=1, offvalue=0)
		self.skip_b.pack()

	def cleanup(self):
		self.parent.temp_alias = self.e.get()
		self.parent.skip = self.check.get()
		self.top.destroy()

class Bulk():
	def __init__(self):
		self.platform = platform.system()
		self.gui = Tk()
		self.files = {}
		self.selected = []
		self.gui.skip = 0

		self.design_gui()
		self.start_gui()

	def start_gui(self):
		self.gui.mainloop()

	def design_gui(self):
		self.gui.title("DAGR Bulk Entry")
		
		self.gui.update_idletasks()

		w = self.gui.winfo_screenwidth()
		h = self.gui.winfo_screenheight()
		size = (600,400)
		x = w/2 - size[0]/2
		y = h/2 - size[1]/2
		self.gui.geometry("%dx%d+%d+%d" % (size + (x, y)))
		
		self.frame = Frame(self.gui)
		self.frame.pack(fill=BOTH, expand=1)
		
		self.set_frame(self.frame)

	def set_frame(self, frame):
		frame.pack(fill=BOTH, expand=True)

		lb = Listbox(frame, selectmode="extended")
		for i in self.files:
			lb.insert(END, self.files[i])
		    
		lb.bind("<<ListboxSelect>>", self.onSelect)    
		lb.pack(pady=15)
		frame.lb = lb

		frame.browse_button = Button(frame, text="Browse", command=self.load_file, width=10)
		frame.browse_button.pack()

		frame.delete_button = Button(frame, text="Remove", command=self.delete_selected, width=10)
		frame.delete_button.pack()

		frame.clear_button = Button(frame, text="Clear", command=self.clear_list, width=10)
		frame.clear_button.pack()

		frame.push_button = Button(frame, text="Add to DB", command=self.push_to_db, width=10)
		frame.push_button.pack()

		frame.exit_button = Button(frame, text="Exit", command=self.exit, width=10)
		frame.exit_button.pack()

	def onSelect(self, val):
		sender = val.widget
		idx = sender.curselection()
		self.selected = []
		for i in idx:
			self.selected.append(sender.get(i))

	def load_file(self):
		fnames = askopenfilenames(title="Select Files")
		if fnames:
			try:
				curr_selections = self.gui.splitlist(fnames)
				
				for curr in curr_selections:
					file_name = self.break_path(curr)

					if file_name not in self.files:
						self.files[file_name] = curr
						self.frame.lb.insert(END, file_name)

				self.frame.lb.update_idletasks()
			except:
				showerror("Open Source File", "Failed to read file\n'%s'" % fnames)
				return

	def delete_selected(self,):
		lb = self.frame.lb
		selections = lb.curselection()

		for filename in self.selected:
			del self.files[filename]

		for i in reversed(selections):
			lb.delete(i)

		lb.update_idletasks()
		del self.selected[:]

	def push_to_db(self):
		self.gui.skip = 0
		for i in self.files:
			try:
			    st = os.stat(self.files[i])
			except IOError:
			    print("failed to get information about", self.files[i])
			else:
				file_data = {}
				db_insert = {}

				file_data['id'] = str(uuid.uuid1())
				file_data['modified'] = str(datetime.datetime.fromtimestamp(st.st_mtime))
				file_data['created'] = str(datetime.datetime.fromtimestamp(st.st_ctime))
				file_data['creator'] = self.get_owner(self.files[i])
				file_data['path'] = self.files[i]

				file_data['file_size'] = st.st_size
				file_data['file_name'] = i

				if "." in file_data['file_name']:
					file_data['file_type'] = i.split('.')[-1]
				else:
					file_data['file_type'] = None

				file_data['parent_id'] = None
				file_data['category_id'] = None
				
				self.gui.temp_alias = i

				if self.gui.skip == 0:
					self.popup(json.dumps(file_data))

				file_data['file_alias'] = self.gui.temp_alias

				lb = self.frame.lb
				index = lb.get(0,END).index(i)
				lb.delete(index)

				self.db_push(file_data)

		self.files.clear()

	def clear_list(self):
		self.frame.lb.delete(0, END)
		self.files.clear()
		del self.selected[:]
		self.frame.lb.update_idletasks()

	def break_path(self, path):
		temp = path.split('/')
		return temp[-1]

	def get_owner(self, path):
		command = str()

		if self.platform == 'Windows':
			clean_path = path.replace('/','\\')
			command = 'dir /q "%s"' % clean_path
			
			info = os.popen(command)
			
			info_split = info.read().split()

			info.close()
			return info_split[-12]

		elif self.platform == 'Linux':
			#print('unix')
			clean_path = path.replace('\\','/')
			command = 'ls -l "%s"' % clean_path
			
			info = os.popen(command)
			
			info_split = info.read().split()
			
			info.close()
			
			return info_split[-5]

	def popup(self, insert):
		self.w=popupWindow(self.gui, insert)
		self.gui.wait_window(self.w.top)

	def db_push(self, dagr):
		headers = {u'content-type': u'application/json'}
		try:
			req = requests.post('http://127.0.0.1:5000/dagrs', headers = headers, data = json.dumps(dagr))
		except ConnectionError:
			print("Failed to establish a connection to the server")
		else:
			if req.status_code == requests.codes.ok:
				print(dagr['file_alias'], "successfully sent")
			else:
				print(dagr['file_alias'], "returned", req.status_code)

	def exit(self):
		self.gui.destroy()
		
def main():
	bulk = Bulk() 

if __name__ == '__main__':
	main()  